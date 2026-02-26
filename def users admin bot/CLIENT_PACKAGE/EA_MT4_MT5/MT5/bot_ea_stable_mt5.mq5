// --- SoftiBridge LITE MT5 ---
#property strict
#property description "SoftiBridge LITE v2 - MT5 (pending orders + spread comp/maxspread + common queue)"
#property version   "3.71b-STABLE"

string SB_BUILD_TAG = "bot_ea_stable";



#include <Trade/Trade.mqh>
#include <Trade/PositionInfo.mqh>
#include <Trade/OrderInfo.mqh>

static string sb_last_peek="";

string SB_ReadQueueSmartCommon(const string relPath)
{
   int h = FileOpen(relPath, FILE_READ|FILE_BIN|FILE_COMMON);
   if(h == INVALID_HANDLE)
   {
      Print(StringFormat("❌ [IO] FileOpen COMMON BIN failed: %s err=%d", relPath, GetLastError()));
      ResetLastError();
      return "";
   }

   int sz = (int)FileSize(h);
   if(sz <= 0) { FileClose(h); return ""; }

   uchar bytes[];
   ArrayResize(bytes, sz);
   int read = (int)FileReadArray(h, bytes, 0, sz);
   FileClose(h);
   if(read <= 0) return "";

   // Detect UTF-16LE (ASCII stored as low byte + 0x00 high byte)
   int zerosOdd=0, samples=0;
   int lim = MathMin(read, 200);
   for(int i=1; i<lim; i+=2){ samples++; if(bytes[i]==0x00) zerosOdd++; }
   bool looksUtf16LE = (samples>10 && zerosOdd > (samples*8)/10);

   // Detect BOM
   bool bomUtf16LE = (read>=2 && bytes[0]==0xFF && bytes[1]==0xFE);
   bool bomUtf8    = (read>=3 && bytes[0]==0xEF && bytes[1]==0xBB && bytes[2]==0xBF);
   int off = 0;
   if(bomUtf16LE) off = 2;
   else if(bomUtf8) off = 3;

   string out = "";

   if(bomUtf16LE || looksUtf16LE)
   {
		// UTF-16LE: decode pairs (low byte first) to avoid garbled text
		for(int i=off; i+1<read; i+=2)
		{
			ushort code = (ushort)bytes[i] | (ushort)((ushort)bytes[i+1] << 8);
			if(code==0) continue;
				// Avoid compiler warning (possible loss of data due to type conversion)
				// and keep full codepoint by formatting as int.
				out += StringFormat("%c", (int)code);
		}
   }
   else
   {
		for(int i=off; i<read; i++)
		{
			ushort code = (ushort)bytes[i];
			if(code==0) continue;
			out += StringFormat("%c", (int)code);
		}
   }

   StringReplace(out, "\r", "");
   return out;
}

string SB_LastNonEmptyLine(string s)
{
   StringReplace(s, "\r", "");
   // Trim trailing newlines/spaces
   while(StringLen(s)>0)
   {
      ushort ch = StringGetCharacter(s, StringLen(s)-1);
      if(ch=='\n' || ch==' ' || ch=='\t') s = StringSubstr(s, 0, StringLen(s)-1);
      else break;
   }
   if(StringLen(s)==0) return "";

   int lastNL = StringFind(s, "\n", 0);
   // We'll scan manually for last newline
   int pos=-1;
   for(int i=0;i<StringLen(s);i++)
   {
      if(StringGetCharacter(s,i)=='\n') pos=i;
   }
   string line = (pos>=0) ? StringSubstr(s, pos+1) : s;
   line = SB_TrimLine(line);
   return line;
}

// (header/includes moved to top)

// --- SB DEBUG HELPERS ---
string SB_TrimLine(string s)
{
   // remove BOM if present
   if(StringLen(s)>=1 && StringGetCharacter(s,0)==0xFEFF) s = StringSubstr(s,1);
   // trim spaces
   StringTrimLeft(s);
   StringTrimRight(s);
   // remove trailing CR
   int n = StringLen(s);
   if(n>0 && StringGetCharacter(s,n-1)==13) s = StringSubstr(s,0,n-1);
   return s;
}
// --- END SB DEBUG HELPERS ---
// --- SB QUEUE PATHS (MT5 inbox patch) ---
string SB_QUEUE_INBOX_MT5 = "softibridge/inbox/cmd_queue_mt5.txt";
string SB_QUEUE_INBOX  = "softibridge/inbox/cmd_queue.txt";
string SB_QUEUE_COMMON = "softibridge/cmd_queue.txt";
string SB_QUEUE_ROOT   = "cmd_queue.txt";
// --- END SB QUEUE PATHS ---

static string _sb_last_raw = "";
static int _sb_last_size = -1;
// --- SB MT5 COMMON-ONLY QUEUE (v3.0.9) ---
void SB_LogEvery(const string msg, const int seconds)
{
   static datetime last=0;
   datetime now=TimeCurrent();
   if(now-last >= seconds){ Print(msg); last=now; }

}

// Pip/Point factor: for most symbols (2/3/5 digits) 1 pip = 10 points; otherwise 1 pip = 1 point.
int SB_PipPoints(const string sym)
{
   int d = (int)SymbolInfoInteger(sym, SYMBOL_DIGITS);
   if(d==2 || d==3 || d==5) return 10;
   return 1;
}
int SB_PipsToPoints(const string sym, const double pips)
{
   return (int)MathRound(pips * (double)SB_PipPoints(sym));
}
double SB_PointsToPips(const string sym, const int points)
{
   return ((double)points) / (double)SB_PipPoints(sym);
}


int SB_OpenQueueCommonRead()
{
   int h = FileOpen(SB_QUEUE_INBOX_MT5, FILE_READ|FILE_TXT|FILE_COMMON);
   if(h!=INVALID_HANDLE) return h;
   h = FileOpen(SB_QUEUE_INBOX, FILE_READ|FILE_TXT|FILE_COMMON);
   if(h!=INVALID_HANDLE) return h;
   h = FileOpen(SB_QUEUE_COMMON, FILE_READ|FILE_TXT|FILE_COMMON);
   if(h!=INVALID_HANDLE) return h;
   h = FileOpen(SB_QUEUE_ROOT, FILE_READ|FILE_TXT|FILE_COMMON);
   return h;
}

int SB_OpenQueueLocalRead()
{
   int h = FileOpen(SB_QUEUE_INBOX_MT5, FILE_READ|FILE_TXT);
   if(h!=INVALID_HANDLE) return h;
   h = FileOpen(SB_QUEUE_INBOX, FILE_READ|FILE_TXT);
   if(h!=INVALID_HANDLE) return h;
   h = FileOpen(SB_QUEUE_COMMON, FILE_READ|FILE_TXT);
   if(h!=INVALID_HANDLE) return h;
   h = FileOpen(SB_QUEUE_ROOT, FILE_READ|FILE_TXT);
   return h;
}


// --- END SB MT5 COMMON-ONLY ---
CTrade trade;

// --- Helpers ---
string StrTrim(string s){
   StringTrimLeft(s);
   StringTrimRight(s);
   return s;
}


// ================================
// Inputs (mirrored from MQ4)
// ================================
input double RiskPercent = 0.5;
input int    DefaultThresholdPips = 5;
input int    DefaultTP1_Pips = 50;
input int    DefaultTP2_Pips = 70;
input int    DefaultTP3_Pips = 100;
input bool   AutoAdjustStops = false;
input int    StopBufferPips  = 2;
input bool   UseSignalSL     = true;   // kept for compatibility (default behavior uses signal SL)
input bool   UseFixedSL      = false;
input int    FixedSL_Pips    = 120;
input bool   UseSLMultiplier = false;
input double SL_Multiplier   = 1.0;
input int    SL_ExtraPips    = 20;
input int    RetrySecondsWhenClosed = 60;
input int    MAGIC = 310126;
input int    SLIPPAGE = 20;
input bool   UIPanelEnabled = true;
input double StepPrice      = 0.10;   // +/- step for Target/SL price
input int    MoveSL_Pips_UI = 10;     // used by MOVE SL button
input int    BE_MinPoints   = 100;    // BE only if >= 100 points in profit
input int    BE_OffsetPoints= 0;     // small buffer to avoid instant stop by spread

// ================================
// Newer entry control (as agreed)
// ================================
input int    EntryTolerancePoints = 30;   // +/- 30 points

// --- Spread handling (MT4 parity) ---
input double MaxSpreadPips = 0.0;        // If >0, max allowed spread in PIPS (converted to points)
input bool   UsePendingVisibility = true; // show pending orders on MT5 like MT4 (auto-cancel on market exec)
input int    MaxSpreadPoints = 0;        // If >0, overrides MaxSpreadPips (DIRECT points)
input bool   AutoBE            = true;  // auto move SL to BE
input int    BE_MinPips        = 10;    // trigger BE after this profit (PIPS)
input bool   SpreadCompensation = true;  // If true, widen entry tolerance by current spread (+ SpreadExtraPips)
input double SpreadExtraPips = 0.0;      // Extra margin in PIPS added on top of current spread when SpreadCompensation is ON

input int    SpreadMaxPoints      = 35;   // max spread
input int    EntryMaxWaitSeconds  = 75;   // wait window
input int    EntryCheckMs         = 100;  // 100ms checks (fast)

// ================================
// Paths (Common\Files\softibridge)
// ================================
string SB_ROOT  = "softibridge";
// MT5 uses its own inbox queue file so MT4+MT5 can run side-by-side on different accounts.
// Bot writes BOTH: cmd_queue.txt (MT4) and cmd_queue_mt5.txt (MT5).
string SB_QUEUE = "softibridge/inbox/cmd_queue_mt5.txt";

// ================================
// Licensing (Automation) - SAFE GATE
// ================================
string SB_TOKEN_FILE = "softibridge_automation/run/auth_token.dat"; // COMMON
string SB_INSTALL_FILE = "softibridge_automation/run/install_id.txt"; // COMMON

string SB_ReadAllCommon(const string path){
   int h = FileOpen(path, FILE_READ|FILE_TXT|FILE_COMMON);
   if(h==INVALID_HANDLE) return "";
   string s="";
   while(!FileIsEnding(h)) s += FileReadString(h) + "\n";
   FileClose(h);
   return s;
}

string SB_JsonGetStr(const string json, const string key){
   string k = "\""+key+"\"";
   int p = StringFind(json, k);
   if(p<0) return "";
   p = StringFind(json, ":", p);
   if(p<0) return "";
   p++;
   while(p<StringLen(json) && (StringGetCharacter(json,p)==' ' || StringGetCharacter(json,p)=='\n' || StringGetCharacter(json,p)=='\r' || StringGetCharacter(json,p)=='\t')) p++;
   if(p>=StringLen(json) || StringGetCharacter(json,p)!='\"') return "";
   p++;
   int e = StringFind(json, "\"", p);
   if(e<0) return "";
   return StringSubstr(json, p, e-p);
}

int SB_JsonGetInt(const string json, const string key){
   string k = "\""+key+"\"";
   int p = StringFind(json, k);
   if(p<0) return 0;
   p = StringFind(json, ":", p);
   if(p<0) return 0;
   p++;
   while(p<StringLen(json) && (StringGetCharacter(json,p)==' ' || StringGetCharacter(json,p)=='\n' || StringGetCharacter(json,p)=='\r' || StringGetCharacter(json,p)=='\t')) p++;
   int e=p;
   while(e<StringLen(json)){
      int c=StringGetCharacter(json,e);
      if((c>='0' && c<='9') || c=='-') { e++; continue; }
      break;
   }
   return (int)StringToInteger(StringSubstr(json,p,e-p));
}

bool SB_JsonGetBool(const string json, const string key, const bool defval){
   string k = "\""+key+"\"";
   int p = StringFind(json, k);
   if(p<0) return defval;
   p = StringFind(json, ":", p);
   if(p<0) return defval;
   p++;
   while(p<StringLen(json) && (StringGetCharacter(json,p)==' ' || StringGetCharacter(json,p)=='\n' || StringGetCharacter(json,p)=='\r' || StringGetCharacter(json,p)=='\t')) p++;
   string tail = StringSubstr(json,p,5);
   if(StringFind(tail,"true")>=0) return true;
   if(StringFind(tail,"false")>=0) return false;
   return defval;
}
string SB_LOG   = "logs\\ea_mt5.log";


// ================================
// UI Panel (MT5) - chart buttons
// ================================

// UI object names
const string UI_PREFIX = "SB_";
const string OBJ_PANEL_BG     = "SB_PANEL_BG";
const string OBJ_BTN_CLOSE_ALL= "SB_BTN_CLOSE_ALL";
const string OBJ_BTN_CLOSE_BUY= "SB_BTN_CLOSE_BUY";
const string OBJ_BTN_CLOSE_SELL="SB_BTN_CLOSE_SELL";const string OBJ_BTN_CANCEL_PEND      = "SB_BTN_CANCEL_PEND";
const string OBJ_BTN_CANCEL_PEND_BUY  = "SB_BTN_CANCEL_PEND_BUY";
const string OBJ_BTN_CANCEL_PEND_SELL = "SB_BTN_CANCEL_PEND_SELL";


bool ui_ready=false;

// create a simple panel + 3 buttons (Close All / Close BUY / Close SELL)

// helper to create button (MT5)
void UI_CreateButton(string name, string text, int bx, int by){
   long cid=ChartID();
   if(ObjectFind(cid, name)<0){
      ObjectCreate(cid, name, OBJ_BUTTON, 0, 0, 0);
   }
   ObjectSetInteger(cid, name, OBJPROP_XDISTANCE, bx);
   ObjectSetInteger(cid, name, OBJPROP_YDISTANCE, by);
   ObjectSetInteger(cid, name, OBJPROP_XSIZE, 170);
   ObjectSetInteger(cid, name, OBJPROP_YSIZE, 20);
   ObjectSetInteger(cid, name, OBJPROP_CORNER, CORNER_LEFT_UPPER);
   ObjectSetString (cid, name, OBJPROP_TEXT, text);
   ObjectSetInteger(cid, name, OBJPROP_HIDDEN, true);
   ObjectSetInteger(cid, name, OBJPROP_SELECTABLE, false);
}

void UI_CreatePanel(){
   if(!UIPanelEnabled) return;
   long cid=ChartID();
   int x=10, y=20, w=190, h=90;

   // background
   if(ObjectFind(cid, OBJ_PANEL_BG)<0){
      ObjectCreate(cid, OBJ_PANEL_BG, OBJ_RECTANGLE_LABEL, 0, 0, 0);
   }
   ObjectSetInteger(cid, OBJ_PANEL_BG, OBJPROP_XDISTANCE, x);
   ObjectSetInteger(cid, OBJ_PANEL_BG, OBJPROP_YDISTANCE, y);
   ObjectSetInteger(cid, OBJ_PANEL_BG, OBJPROP_XSIZE, w);
   ObjectSetInteger(cid, OBJ_PANEL_BG, OBJPROP_YSIZE, h);
   ObjectSetInteger(cid, OBJ_PANEL_BG, OBJPROP_CORNER, CORNER_LEFT_UPPER);
   ObjectSetInteger(cid, OBJ_PANEL_BG, OBJPROP_BACK, false);
   ObjectSetInteger(cid, OBJ_PANEL_BG, OBJPROP_SELECTABLE, false);
   ObjectSetInteger(cid, OBJ_PANEL_BG, OBJPROP_HIDDEN, true);

   // helper to create button
   UI_CreateButton(OBJ_BTN_CLOSE_ALL, "CLOSE ALL", x+10, y+10);
      UI_CreateButton(OBJ_BTN_CLOSE_BUY, "CLOSE BUY", x+10, y+35);
      UI_CreateButton(OBJ_BTN_CLOSE_SELL,"CLOSE SELL",x+10, y+60);

   ui_ready=true;
   ChartRedraw(cid);
}

void UI_DestroyPanel(){
   long cid=ChartID();
   string objs[4]={OBJ_PANEL_BG,OBJ_BTN_CLOSE_ALL,OBJ_BTN_CLOSE_BUY,OBJ_BTN_CLOSE_SELL};
   for(int i=0;i<4;i++){
      if(ObjectFind(cid, objs[i])>=0) ObjectDelete(cid, objs[i]);
   }
   ui_ready=false;
}

// Close positions created by this EA (Magic + comment contains "SoftiBridge")
void CloseFiltered(int filterType)
{
   CTrade utrade;
   utrade.SetDeviationInPoints(SLIPPAGE);
   utrade.SetAsyncMode(false);

   string sym = _Symbol;
   int tried=0, closed=0, failed=0;

   for(int i=PositionsTotal()-1; i>=0; i--)
   {
      ulong ticket = PositionGetTicket(i);
      if(ticket==0) continue;
      if(!PositionSelectByTicket(ticket)) continue;

      if(PositionGetString(POSITION_SYMBOL)!=sym) continue;

      long type = PositionGetInteger(POSITION_TYPE);
      if(filterType==1 && type!=POSITION_TYPE_BUY) continue;
      if(filterType==2 && type!=POSITION_TYPE_SELL) continue;

      tried++;
      ResetLastError();
      bool ok = utrade.PositionClose(ticket);
      if(ok) closed++;
      else
      {
         failed++;
         int err = GetLastError();
         Print(StringFormat("[UI|bot_ea_stable] ❌ PositionClose failed ticket=%I64u err=%d ret=%d %s",
                            ticket, err, (int)utrade.ResultRetcode(), utrade.ResultRetcodeDescription()));
      }
   }
   Print(StringFormat("[UI|bot_ea_stable] CloseFiltered(%d) sym=%s tried=%d closed=%d failed=%d", filterType, sym, tried, closed, failed));
}


void CancelPendingBySymbol(const string sym, int filterType)
{
   // filterType: 0=ALL, 1=BUY, 2=SELL
   int tried=0, cancelled=0, failed=0;

   for(int i=OrdersTotal()-1; i>=0; i--)
   {
      ulong ticket = OrderGetTicket(i);
      if(ticket==0) continue;
      if(!OrderSelect(ticket)) continue;

      string osym = OrderGetString(ORDER_SYMBOL);
      if(osym != sym) continue;

      ENUM_ORDER_TYPE t = (ENUM_ORDER_TYPE)OrderGetInteger(ORDER_TYPE);
      bool isPending = (t==ORDER_TYPE_BUY_LIMIT || t==ORDER_TYPE_SELL_LIMIT ||
                        t==ORDER_TYPE_BUY_STOP  || t==ORDER_TYPE_SELL_STOP  ||
                        t==ORDER_TYPE_BUY_STOP_LIMIT || t==ORDER_TYPE_SELL_STOP_LIMIT);
      if(!isPending) continue;

      if(filterType==1 && !(t==ORDER_TYPE_BUY_LIMIT || t==ORDER_TYPE_BUY_STOP || t==ORDER_TYPE_BUY_STOP_LIMIT)) continue;
      if(filterType==2 && !(t==ORDER_TYPE_SELL_LIMIT || t==ORDER_TYPE_SELL_STOP || t==ORDER_TYPE_SELL_STOP_LIMIT)) continue;

      tried++;
      MqlTradeRequest req; MqlTradeResult res;
      ZeroMemory(req); ZeroMemory(res);
      req.action = TRADE_ACTION_REMOVE;
      req.order  = ticket;
      req.symbol = sym;

      ResetLastError();
      bool ok = OrderSend(req, res);
      if(ok && (res.retcode==10009 || res.retcode==10008)) // request accepted / done
         cancelled++;
      else
      {
         failed++;
         int err = GetLastError();
         Print(StringFormat("[UI|bot_ea_stable] ❌ Cancel pending failed ticket=%I64u err=%d ret=%d %s",
                            ticket, err, (int)res.retcode, res.comment));
      }
   }

   Print(StringFormat("[UI|bot_ea_stable] CancelPendingBySymbol(%d) sym=%s tried=%d cancelled=%d failed=%d",
                      filterType, sym, tried, cancelled, failed));
}



void UI_CreateButtons(){
   int x=20, y=18;
   UI_CreateButton(OBJ_BTN_CLOSE_ALL,  "CLOSE ALL", x, y); y+=24;
   UI_CreateButton(OBJ_BTN_CLOSE_BUY,  "CLOSE BUY", x, y); y+=24;
   UI_CreateButton(OBJ_BTN_CLOSE_SELL, "CLOSE SELL",x, y); y+=30;

   UI_CreateButton(OBJ_BTN_CANCEL_PEND,      "CANCEL PENDING", x, y); y+=24;
   UI_CreateButton(OBJ_BTN_CANCEL_PEND_BUY,  "CANCEL PEND BUY", x, y); y+=24;
   UI_CreateButton(OBJ_BTN_CANCEL_PEND_SELL, "CANCEL PEND SELL",x, y);
}

void OnChartEvent(const int id,
                  const long &lparam,
                  const double &dparam,
                  const string &sparam)
{
   if(id==CHARTEVENT_OBJECT_CLICK)
   {
      if(sparam==OBJ_BTN_CLOSE_ALL)  { CloseFiltered(0); return; }
      if(sparam==OBJ_BTN_CLOSE_BUY)  { CloseFiltered(1); return; }
      if(sparam==OBJ_BTN_CLOSE_SELL) { CloseFiltered(2); return; }

      if(sparam==OBJ_BTN_CANCEL_PEND)      { CancelPendingBySymbol(_Symbol,0); return; }
      if(sparam==OBJ_BTN_CANCEL_PEND_BUY)  { CancelPendingBySymbol(_Symbol,1); return; }
      if(sparam==OBJ_BTN_CANCEL_PEND_SELL) { CancelPendingBySymbol(_Symbol,2); return; }
   }
}

// simple context for transparent logs
string g_ctx_symbol="";
string g_ctx_side="";
double g_ctx_signal_price=0.0;
double g_ctx_req_price=0.0;
int    g_ctx_spread_pts=0;
int    g_ctx_dev_pts=0;
string g_ctx_comment="";

struct SBCommand {
   string id;
   string mode;      // PIPS / PRICE / SHORTHAND
   string symbol;
   string side;      // BUY / SELL
   double entry;
   int    sl_pips;
   // SHORTHAND (Format2)
   int    sh_entry1;
   int    sh_entry2;
   int    sh_entry3;
   int    sh_sl;
   int    sh_tp1;
   int    sh_tp2;
   int    sh_tp3;
   int    sh_open;
   int    tp1_pips;
   int    tp2_pips;
   int    tp3_pips;
   string exec;      // AUTO
   int    threshold_pips;
   string comment;
   long   ts;
};

datetime g_last_queue_mtime=0;
long     g_last_queue_size=0;

// entry waiting state
bool     g_waiting=false;
string g_pending_id="";
bool   g_pending_placed=false;

datetime g_wait_deadline=0;
SBCommand g_wait_cmd;
string g_wait_rawline="";

// ----------------------------
// Helpers
// ----------------------------
string CommonPath() {
   // In MT5, FILE_COMMON points to common files.
   return SB_ROOT + "\\";
}

bool FileExistsCommon(string rel){
   int h = FileOpen(CommonPath()+rel, FILE_READ|FILE_COMMON|FILE_TXT);
   if(h!=INVALID_HANDLE){ FileClose(h); return true; }
   return false;
}

void EnsureDirs(){
   // MT5 can't create dirs directly in common; rely on existing or fail silently.
}

void LogLine(string s){
   Print(s);
   int h = FileOpen(CommonPath()+SB_LOG, FILE_WRITE|FILE_READ|FILE_COMMON|FILE_TXT|FILE_ANSI);
   if(h!=INVALID_HANDLE){
      FileSeek(h,0,SEEK_END);
      FileWrite(h, TimeToString(TimeCurrent(),TIME_DATE|TIME_SECONDS)+" | "+s);
      FileClose(h);
   }
}

int SpreadPoints(string sym){
   double ask=0,bid=0;
   if(!SymbolInfoDouble(sym,SYMBOL_ASK,ask) || !SymbolInfoDouble(sym,SYMBOL_BID,bid)) return 999999;
   double pt = SymbolInfoDouble(sym,SYMBOL_POINT);
   if(pt<=0) return 999999;
   return (int)MathRound((ask-bid)/pt);
}


double SB_PipSize(const string sym)
{
   // Softi convention: 1 pip = 10 points (works for 2/3/5-digit symbols; e.g. XAUUSD 2 decimals => 0.01 point => 0.10 pip)
   return SymbolInfoDouble(sym, SYMBOL_POINT) * 10.0;
}

double PipToPrice(const string sym, const int pips)
{
   return (double)pips * SB_PipSize(sym);
}

double PointsToPips(const string sym, const int points)
{
   return (double)points / 10.0; // 10 points = 1 pip
}

int PipsToPoints(const double pips)
{
   return (int)MathRound(pips * 10.0);
}


double NormalizeVolume(string sym,double vol){
   double vmin=SymbolInfoDouble(sym,SYMBOL_VOLUME_MIN);
   double vmax=SymbolInfoDouble(sym,SYMBOL_VOLUME_MAX);
   double vstep=SymbolInfoDouble(sym,SYMBOL_VOLUME_STEP);
   if(vol<vmin) vol=vmin;
   if(vol>vmax) vol=vmax;
   // round down to step
   vol = MathFloor(vol/vstep)*vstep;
   if(vol<vmin) vol=vmin;
   return vol;
}

double CalcLotsByRisk(string sym,int sl_pips){
   if(sl_pips<=0) sl_pips=FixedSL_Pips;
   double bal = AccountInfoDouble(ACCOUNT_BALANCE);
   double risk_money = bal * (RiskPercent/100.0);

   double tick_value = SymbolInfoDouble(sym,SYMBOL_TRADE_TICK_VALUE);
   double tick_size  = SymbolInfoDouble(sym,SYMBOL_TRADE_TICK_SIZE);
   if(tick_value<=0 || tick_size<=0){
      return NormalizeVolume(sym, SymbolInfoDouble(sym,SYMBOL_VOLUME_MIN));
   }
   double sl_price = PipToPrice(sym, sl_pips);
   // number of ticks in sl distance:
   double ticks = sl_price / tick_size;
   if(ticks<=0) ticks=1;
   double money_per_lot = ticks * tick_value;
   if(money_per_lot<=0) money_per_lot=1;

   double lots = risk_money / money_per_lot;
   return NormalizeVolume(sym, lots);
}

bool ParseKVLine(string line, SBCommand &cmd){
   // format: key=val;key=val;...
   cmd.id=""; cmd.mode=""; cmd.symbol=""; cmd.side=""; cmd.entry=0;
   cmd.sl_pips=0; cmd.tp1_pips=0; cmd.tp2_pips=0; cmd.tp3_pips=0;
   cmd.sh_entry1=0; cmd.sh_entry2=0;
      cmd.sh_entry3=0; cmd.sh_sl=0; cmd.sh_tp1=0; cmd.sh_tp2=0;
      cmd.sh_tp3=0;
      cmd.sh_tp3=0; cmd.sh_open=0;
   cmd.exec="AUTO"; cmd.threshold_pips=DefaultThresholdPips; cmd.comment="SoftiBridge";
   cmd.ts=0;

   string parts[];
   int n = StringSplit(line,';',parts);
   if(n<2) return false;

   for(int i=0;i<n;i++){
      string kv=parts[i];
      int p=StringFind(kv,"=");
      if(p<0) continue;
      string k=StrTrim(StringSubstr(kv,0,p));
      string v=StrTrim(StringSubstr(kv,p+1));
      if(k=="id") cmd.id=v;
      else if(k=="ts") cmd.ts=(long)StringToInteger(v);
      else if(k=="mode") cmd.mode=v;
      else if(k=="symbol") cmd.symbol=v;
      else if(k=="side") cmd.side=v;
      else if(k=="entry") cmd.entry=StringToDouble(v);
      else if(k=="entry1") cmd.sh_entry1=(int)StringToInteger(v);
      else if(k=="entry2") cmd.sh_entry2=(int)StringToInteger(v);
      else if(k=="sl")     cmd.sh_sl=(int)StringToInteger(v);
      else if(k=="tp1")    cmd.sh_tp1=(int)StringToInteger(v);
      else if(k=="tp2")    cmd.sh_tp2=(int)StringToInteger(v);
      else if(k=="open")   cmd.sh_open=(int)StringToInteger(v);

      else if(k=="sl_pips") cmd.sl_pips=(int)StringToInteger(v);
      else if(k=="tp1_pips") cmd.tp1_pips=(int)StringToInteger(v);
      else if(k=="tp2_pips") cmd.tp2_pips=(int)StringToInteger(v);
      else if(k=="tp3_pips") cmd.tp3_pips=(int)StringToInteger(v);
      else if(k=="exec") cmd.exec=v;
      else if(k=="threshold_pips") cmd.threshold_pips=(int)StringToInteger(v);
      else if(k=="comment") cmd.comment=v;
   }
   if(cmd.symbol=="") cmd.symbol=_Symbol;
   if(cmd.tp1_pips<=0) cmd.tp1_pips=DefaultTP1_Pips;
   if(cmd.tp2_pips<=0) cmd.tp2_pips=DefaultTP2_Pips;
   if(cmd.tp3_pips<=0) cmd.tp3_pips=DefaultTP3_Pips;
   if(cmd.sl_pips<=0) cmd.sl_pips=FixedSL_Pips;
   if(cmd.mode=="") cmd.mode="PIPS";
   return (cmd.side=="BUY" || cmd.side=="SELL");
}



bool ReadNewestQueueLine(string &outLine){
   outLine="";
   string all = SB_ReadQueueSmartCommon("softibridge/inbox/cmd_queue_mt5.txt");
   if(all=="") return false;
   string last = SB_LastNonEmptyLine(all);
   if(last=="" || last=="0") return false;
   outLine = last;
   return true;
}



// NOTE: MT5 lacks FileReadLine in strict? We'll implement safer read using FileReadString in a loop with '\n' handling would be complex.
// For production, queue should store one command per token-friendly line without spaces. Current cmd format is token-friendly (no spaces).
// So FileReadString works.

double SideMarketPrice(string sym,string side){
   double ask=0,bid=0;
   if(!GetBidAsk(sym, bid, ask)) { Print(StringFormat("[SB|bot_ea_stable] NO_TICK | sym=%s -> WAIT", sym)); return false; }
   if(side=="BUY") return ask;
   return bid;
}

bool EntryConditionsOk(const SBCommand &cmd, int &spreadPts, int &devPts, double &reqPrice){
   // MT4 behavior is suffix-safe: validation/execution is always done on the CHART symbol.
   // Many MT5 brokers add suffixes (e.g. XAUUSD.p) so signals may carry XAUUSD
   // while the tradable symbol on the chart is XAUUSD.p. To match MT4, we use _Symbol.
   string sym = _Symbol;
   SymbolSelect(sym,true);

   spreadPts = SpreadPoints(sym);
   reqPrice  = SideMarketPrice(sym, cmd.side);
   double pt = SymbolInfoDouble(sym,SYMBOL_POINT);
   if(pt<=0.0){
      devPts = 0;
   } else {
      devPts = (int)MathRound(MathAbs(reqPrice - cmd.entry)/pt);
   }

   g_ctx_symbol=sym;
   g_ctx_side=cmd.side;
   g_ctx_signal_price=cmd.entry;
   g_ctx_req_price=reqPrice;
   g_ctx_spread_pts=spreadPts;
   g_ctx_dev_pts=devPts;
   g_ctx_comment=cmd.comment;

   
// Effective MaxSpread (points): MaxSpreadPoints overrides MaxSpreadPips (pips->points using 10 points = 1 pip)
int effMaxPts = 0;
if(MaxSpreadPoints > 0) effMaxPts = MaxSpreadPoints;
else if(MaxSpreadPips > 0.0) effMaxPts = (int)MathRound(MaxSpreadPips * 10.0);

if(effMaxPts > 0 && spreadPts > effMaxPts) return false;

// Effective entry tolerance (points). If SpreadCompensation is ON, widen tolerance by current spread + extra margin
int effTolPts = EntryTolerancePoints;
if(SpreadCompensation)
{
   int extraPts = spreadPts + (int)MathCeil(SpreadExtraPips * 10.0);
   effTolPts += extraPts;
}
if(devPts > effTolPts) return false;

   return true;
}

bool PlaceMarket3(const SBCommand &cmd){
   // In MT5 the chart symbol rules (user decision): execution ALWAYS uses the chart symbol.
   string sym = _Symbol;
   SymbolSelect(sym,true);
   LogLine(StringFormat("SB SYMBOL | signal=%s exec=%s", cmd.symbol, sym));

   // SL/TP prices
   double pt=SymbolInfoDouble(sym,SYMBOL_POINT);
   double ask=0,bid=0;
   if(!GetBidAsk(sym, bid, ask)) { Print(StringFormat("[SB|bot_ea_stable] NO_TICK | sym=%s -> WAIT", sym)); return false; }
   double price = (cmd.side=="BUY") ? ask : bid;

   int sl_pips = cmd.sl_pips;
   if(UseFixedSL) sl_pips = FixedSL_Pips;
   if(UseSLMultiplier) sl_pips = (int)MathRound(sl_pips * SL_Multiplier);
   sl_pips += SL_ExtraPips;

   double sl_dist = PipToPrice(sym, sl_pips);
   double sl = (cmd.side=="BUY") ? price - sl_dist : price + sl_dist;

   double tp1 = (cmd.side=="BUY") ? price + PipToPrice(sym, cmd.tp1_pips) : price - PipToPrice(sym, cmd.tp1_pips);
   double tp2 = (cmd.side=="BUY") ? price + PipToPrice(sym, cmd.tp2_pips) : price - PipToPrice(sym, cmd.tp2_pips);
   double tp3 = (cmd.side=="BUY") ? price + PipToPrice(sym, cmd.tp3_pips) : price - PipToPrice(sym, cmd.tp3_pips);

   double lots_total = CalcLotsByRisk(sym, sl_pips);
   // Split logic (like MT4 behavior): try 3 orders, if lots too small, reduce count
   double vmin=SymbolInfoDouble(sym,SYMBOL_VOLUME_MIN);
   int n=3;
   double per = NormalizeVolume(sym, lots_total/n);
   if(per < vmin){
      n=2; per = NormalizeVolume(sym, lots_total/n);
      if(per < vmin){
         n=1; per = NormalizeVolume(sym, lots_total);
      }
   }

   trade.SetExpertMagicNumber(MAGIC);
   trade.SetDeviationInPoints(SLIPPAGE);

   bool ok=true;
   for(int i=1;i<=n;i++){
      double tp = (i==1)?tp1: (i==2?tp2:tp3);
      string cmt = StringFormat("SoftiBridge|%s|TP%d", cmd.id, i);
      bool r=false;
      if(cmd.side=="BUY") r = trade.Buy(per, sym, 0.0, sl, tp, cmt);
      else               r = trade.Sell(per, sym, 0.0, sl, tp, cmt);
      if(!r){
         ok=false;
         LogLine(StringFormat("SB EXEC FAIL | sym=%s side=%s ret=%d err=%d", sym, cmd.side, (int)trade.ResultRetcode(), GetLastError()));
      } else {
         LogLine(StringFormat("SB EXEC | sym=%s | side=%s | signal=%.2f | req=%.2f | exec=%.2f | spread_pts=%d | dev_pts=%+d | ticket=%I64d | %s",
            sym, cmd.side, cmd.entry, g_ctx_req_price, trade.ResultPrice(), g_ctx_spread_pts, (cmd.side=="BUY"? +g_ctx_dev_pts: -g_ctx_dev_pts),
            trade.ResultDeal(), cmt
         ));
      }
   }
   return ok;
}

// --- Pending-order mode (MT4-like) ---
// If price is not yet within EntryTolerance, we place pending orders immediately so the user can see them in MT5.
// Orders are set with broker-side expiration = TimeCurrent() + EntryMaxWaitSeconds.
// SpreadCompensation is applied by shifting the pending entry price by current spread (+ optional SpreadExtraPips).

int CancelPendingByPrefix(const string prefix){
   int cancelled=0;
   for(int i=OrdersTotal()-1; i>=0; i--){
      ulong ticket0=OrderGetTicket(i);
       if(ticket0==0) continue;
       if(!OrderSelect(ticket0)) continue;
      if(OrderGetInteger(ORDER_MAGIC) != MAGIC) continue;
      string c = OrderGetString(ORDER_COMMENT);
      if(StringFind(c, prefix) < 0) continue;
      ulong ticket = (ulong)OrderGetInteger(ORDER_TICKET);
      MqlTradeRequest req; MqlTradeResult res;
      ZeroMemory(req); ZeroMemory(res);
      req.action = TRADE_ACTION_REMOVE;
      req.order  = ticket;
      req.symbol = OrderGetString(ORDER_SYMBOL);
      if(OrderSend(req,res)){
         cancelled++;
      }
   }
   return cancelled;
}

int CancelPendingBySymbolMagic(const string sym, int filterType){
   // filterType: 0=ALL, 1=BUY, 2=SELL
   int cancelled=0;
   for(int i=OrdersTotal()-1; i>=0; i--){
      ulong ticket0=OrderGetTicket(i);
      if(ticket0==0) continue;
      if(!OrderSelect(ticket0)) continue;
      if(OrderGetInteger(ORDER_MAGIC) != MAGIC) continue;
      string osym = OrderGetString(ORDER_SYMBOL);
      if(osym!=sym) continue;
      ENUM_ORDER_TYPE ot = (ENUM_ORDER_TYPE)OrderGetInteger(ORDER_TYPE);
      bool isBuy = (ot==ORDER_TYPE_BUY_LIMIT || ot==ORDER_TYPE_BUY_STOP || ot==ORDER_TYPE_BUY_STOP_LIMIT);
      bool isSell= (ot==ORDER_TYPE_SELL_LIMIT|| ot==ORDER_TYPE_SELL_STOP|| ot==ORDER_TYPE_SELL_STOP_LIMIT);
      if(filterType==1 && !isBuy) continue;
      if(filterType==2 && !isSell) continue;

      ulong ticket = (ulong)OrderGetInteger(ORDER_TICKET);
      MqlTradeRequest req; MqlTradeResult res;
      ZeroMemory(req); ZeroMemory(res);
      req.action = TRADE_ACTION_REMOVE;
      req.order  = ticket;
      req.symbol = osym;
      if(OrderSend(req,res)) cancelled++;
      else Print(StringFormat("[UI|bot_ea_stable] ❌ OrderDelete failed ticket=%I64u err=%d", ticket, GetLastError()));
   }
   Print(StringFormat("[UI|bot_ea_stable] CancelPendingBySymbolMagic(%d) sym=%s cancelled=%d", filterType, sym, cancelled));
   return cancelled;
}





// --- Pending-order mode (MT4-like) ---
// If price is not yet within EntryTolerance, we place pending orders immediately so the user can see them in MT5.
// Orders are set with broker-side expiration = TimeCurrent() + EntryMaxWaitSeconds.
// SpreadCompensation is applied by shifting the pending entry price by current spread (+ optional SpreadExtraPips).









// --- Pending-order mode (MT4-like) ---
// If price is not yet within EntryTolerance, we place pending orders immediately so the user can see them in MT5.
// Orders are set with broker-side expiration = TimeCurrent() + EntryMaxWaitSeconds.
// SpreadCompensation is applied by shifting the pending entry price by current spread (+ optional SpreadExtraPips).









// --- Pending-order mode (MT4-like) ---
// If price is not yet within EntryTolerance, we place pending orders immediately so the user can see them in MT5.
// Orders are set with broker-side expiration = TimeCurrent() + EntryMaxWaitSeconds.
// SpreadCompensation is applied by shifting the pending entry price by current spread (+ optional SpreadExtraPips).







bool PlacePending3(const SBCommand &cmd){
   string sym = cmd.symbol;
   if(sym=="" || !SymbolSelect(sym,true)) sym = _Symbol;

   // Ensure we can trade the symbol
   if(!SymbolSelect(sym,true)){
      Print(StringFormat("[SB|bot_ea_stable] ❌ symbol not selectable: %s", sym));
      return false;
   }

   // Current bid/ask
   double bid=0.0, ask=0.0;
   if(!GetBidAsk(sym, bid, ask)){
      Print(StringFormat("[SB|bot_ea_stable] NO_TICK | sym=%s -> WAIT", sym));
      return false;
   }

   // Symbol point/digits (IMPORTANT: don't use chart _Point)
   double ptSym=0.0; int dgSym=0;
   SymbolInfoDouble(sym, SYMBOL_POINT, ptSym);
   dgSym = (int)SymbolInfoInteger(sym, SYMBOL_DIGITS);

   // Spread in points
   int spreadPts = (int)SymbolInfoInteger(sym,SYMBOL_SPREAD);
   if(spreadPts<0) spreadPts=0;

   // Extra margin in points
   int extraPts = 0;
   if(SpreadExtraPips>0.0) extraPts = SB_PipsToPoints(sym, SpreadExtraPips);

   // Entry shift (points) when SpreadCompensation is enabled
   int shiftPts = 0;
   if(SpreadCompensation) shiftPts = spreadPts + extraPts;

// --------------------------------------------------
// FORMAT 2 (SHORTHAND): Xau Buy 80/75 | Sl 70 | Tp 85/90 Open
// Pairing rule: entry1->tp1 and entry2->tp2 (low->low, high->high).
// Base computed from current Bid/Ask using base100 (floor to 100).
// --------------------------------------------------
if(cmd.mode=="SHORTHAND")
{
   if(cmd.sh_entry1<=0 || cmd.sh_entry2<=0 || cmd.sh_sl<=0 || cmd.sh_tp1<=0 || cmd.sh_tp2<=0){
      Print("[SB|bot_ea_stable] ❌ SHORTHAND missing fields (entry1/entry2/sl/tp1/tp2).");
      return false;
   }

   double ref = (cmd.side=="BUY") ? ask : bid;
   double base = MathFloor(ref/100.0)*100.0;
   if(base<=0.0){
      Print(StringFormat("[SB|bot_ea_stable] NO_BASE | sym=%s ref=%.5f -> WAIT", sym, ref));
      return false;
   }

   // Prices from base100
   double entryA = base + (double)cmd.sh_entry1;
   double entryB = base + (double)cmd.sh_entry2;
   double tpA    = base + (double)cmd.sh_tp1;
   double tpB    = base + (double)cmd.sh_tp2;
   double sl     = base + (double)cmd.sh_sl;

   // Apply SL extra pips (push SL further away)
   int slExtraPts = SB_PipsToPoints(sym, SL_ExtraPips);
   if(slExtraPts<0) slExtraPts=0;
   if(cmd.side=="BUY")  sl -= (double)slExtraPts * ptSym;
   if(cmd.side=="SELL") sl += (double)slExtraPts * ptSym;

   // Apply entry shift for spread compensation (entries only)
   if(cmd.side=="BUY")  { entryA += (double)shiftPts * ptSym; entryB += (double)shiftPts * ptSym; }
   if(cmd.side=="SELL") { entryA -= (double)shiftPts * ptSym; entryB -= (double)shiftPts * ptSym; }

   entryA = NormalizeDouble(entryA, dgSym);
   entryB = NormalizeDouble(entryB, dgSym);
   sl     = NormalizeDouble(sl, dgSym);
   tpA    = NormalizeDouble(tpA, dgSym);
   tpB    = NormalizeDouble(tpB, dgSym);

   // Decide type per entry
   bool useStopA=false, useStopB=false;
   if(cmd.side=="BUY")  { useStopA = (entryA > ask); useStopB = (entryB > ask); }
   if(cmd.side=="SELL") { useStopA = (entryA < bid); useStopB = (entryB < bid); }

   // Expiration
   datetime nowSrv = (datetime)TimeTradeServer();
   datetime exp    = (datetime)(nowSrv + (int)EntryMaxWaitSeconds);
   if(exp <= nowSrv + 30) exp = nowSrv + 60;

   ENUM_ORDER_TYPE_TIME ttype = ORDER_TIME_GTC;
CTrade ptrade;
   ptrade.SetExpertMagicNumber(MAGIC);
   ptrade.SetDeviationInPoints(SLIPPAGE);

   // Lot sizing: keep stable split (2 or 3 orders depending on OPEN)
   double lotsTotal = CalcLotsByRisk(sym, FixedSL_Pips);
   if(lotsTotal<=0.0){ Print("[SB|bot_ea_stable] ❌ lots <= 0"); return false; }
   int orderCount = (cmd.sh_open==1) ? 3 : 2;
   double lotsEach = NormalizeVolume(sym, lotsTotal/(double)orderCount);
   if(lotsEach<=0.0) lotsEach = NormalizeVolume(sym, lotsTotal);
   double vmin=SymbolInfoDouble(sym,SYMBOL_VOLUME_MIN);
   if(lotsEach < vmin) lotsEach = vmin;

   // MaxSpread filter (points)
   int effMaxPts = 0;
   if(MaxSpreadPoints>0) effMaxPts = MaxSpreadPoints;
   else if(MaxSpreadPips>0.0) effMaxPts = (int)MathRound(MaxSpreadPips*10.0);
   if(effMaxPts>0 && spreadPts>effMaxPts){
      Print(StringFormat("[SB|bot_ea_stable] 🚫 MaxSpread exceeded: spreadPts=%d > %d", spreadPts, effMaxPts));
      return false;
   }

   bool ok=true;
   string cA=StringFormat("%s-PND-E1", cmd.comment);
   string cB=StringFormat("%s-PND-E2", cmd.comment);
   string cO=StringFormat("%s-PND-OPEN", cmd.comment);

   // Place entryA -> tpA
   bool rA=false;
   if(cmd.side=="BUY")  rA = (useStopA? ptrade.BuyStop(lotsEach, entryA, sym, sl, tpA, ttype, exp, cA) : ptrade.BuyLimit(lotsEach, entryA, sym, sl, tpA, ttype, exp, cA));
   if(cmd.side=="SELL") rA = (useStopA? ptrade.SellStop(lotsEach, entryA, sym, sl, tpA, ttype, exp, cA) : ptrade.SellLimit(lotsEach, entryA, sym, sl, tpA, ttype, exp, cA));
   if(!rA){
      int err=GetLastError();
      if(err==4756){
         ResetLastError();
         ENUM_ORDER_TYPE_TIME t2 = ORDER_TIME_GTC;
         datetime e0=0;
         rA=false;
         if(cmd.side=="BUY")  rA = (useStopA? ptrade.BuyStop(lotsEach, entryA, sym, sl, tpA, t2, e0, cA) : ptrade.BuyLimit(lotsEach, entryA, sym, sl, tpA, t2, e0, cA));
         if(cmd.side=="SELL") rA = (useStopA? ptrade.SellStop(lotsEach, entryA, sym, sl, tpA, t2, e0, cA) : ptrade.SellLimit(lotsEach, entryA, sym, sl, tpA, t2, e0, cA));
         if(!rA){ ok=false; Print(StringFormat("[SB|bot_ea_stable] ❌ SH pending E1 failed err=%d", GetLastError())); }
      }else{
         ok=false; Print(StringFormat("[SB|bot_ea_stable] ❌ SH pending E1 failed err=%d", err));
      }
      ResetLastError();
   }

   // Place entryB -> tpB
   bool rB=false;
   if(cmd.side=="BUY")  rB = (useStopB? ptrade.BuyStop(lotsEach, entryB, sym, sl, tpB, ttype, exp, cB) : ptrade.BuyLimit(lotsEach, entryB, sym, sl, tpB, ttype, exp, cB));
   if(cmd.side=="SELL") rB = (useStopB? ptrade.SellStop(lotsEach, entryB, sym, sl, tpB, ttype, exp, cB) : ptrade.SellLimit(lotsEach, entryB, sym, sl, tpB, ttype, exp, cB));
   if(!rB){
      int err=GetLastError();
      if(err==4756){
         ResetLastError();
         ENUM_ORDER_TYPE_TIME t2 = ORDER_TIME_GTC;
         datetime e0=0;
         rB=false;
         if(cmd.side=="BUY")  rB = (useStopB? ptrade.BuyStop(lotsEach, entryB, sym, sl, tpB, t2, e0, cB) : ptrade.BuyLimit(lotsEach, entryB, sym, sl, tpB, t2, e0, cB));
         if(cmd.side=="SELL") rB = (useStopB? ptrade.SellStop(lotsEach, entryB, sym, sl, tpB, t2, e0, cB) : ptrade.SellLimit(lotsEach, entryB, sym, sl, tpB, t2, e0, cB));
         if(!rB){ ok=false; Print(StringFormat("[SB|bot_ea_stable] ❌ SH pending E2 failed err=%d", GetLastError())); }
      }else{
         ok=false; Print(StringFormat("[SB|bot_ea_stable] ❌ SH pending E2 failed err=%d", err));
      }
      ResetLastError();
   }

   // Optional OPEN order at entryB with no TP
   if(cmd.sh_open==1){
      bool rO=false;
      if(cmd.side=="BUY")  rO = (useStopB? ptrade.BuyStop(lotsEach, entryB, sym, sl, 0.0, ttype, exp, cO) : ptrade.BuyLimit(lotsEach, entryB, sym, sl, 0.0, ttype, exp, cO));
      if(cmd.side=="SELL") rO = (useStopB? ptrade.SellStop(lotsEach, entryB, sym, sl, 0.0, ttype, exp, cO) : ptrade.SellLimit(lotsEach, entryB, sym, sl, 0.0, ttype, exp, cO));
      if(!rO){
         int err=GetLastError();
         if(err==4756){
            ResetLastError();
            ENUM_ORDER_TYPE_TIME t2 = ORDER_TIME_GTC;
            datetime e0=0;
            rO=false;
            if(cmd.side=="BUY")  rO = (useStopB? ptrade.BuyStop(lotsEach, entryB, sym, sl, 0.0, t2, e0, cO) : ptrade.BuyLimit(lotsEach, entryB, sym, sl, 0.0, t2, e0, cO));
            if(cmd.side=="SELL") rO = (useStopB? ptrade.SellStop(lotsEach, entryB, sym, sl, 0.0, t2, e0, cO) : ptrade.SellLimit(lotsEach, entryB, sym, sl, 0.0, t2, e0, cO));
            if(!rO){ ok=false; Print(StringFormat("[SB|bot_ea_stable] ❌ SH pending OPEN failed err=%d", GetLastError())); }
         }else{
            ok=false; Print(StringFormat("[SB|bot_ea_stable] ❌ SH pending OPEN failed err=%d", err));
         }
         ResetLastError();
      }
   }

   if(ok){
      Print(StringFormat("[SB|bot_ea_stable] ✓ SHORTHAND pending placed sym=%s base=%.2f e1=%.2f->tp1=%.2f e2=%.2f->tp2=%.2f sl=%.2f open=%d",
                         sym, base, entryA, tpA, entryB, tpB, sl, cmd.sh_open));
   }
   return ok;
}



   // Adjust entry price to compensate spread (BUY => higher price, SELL => lower price)
   double entry = cmd.entry;
   if(cmd.side=="BUY")  entry += (double)shiftPts * ptSym;
   if(cmd.side=="SELL") entry -= (double)shiftPts * ptSym;

   // SL uses cmd.sl_pips plus SL_ExtraPips (ONLY SL)
   int slPts = SB_PipsToPoints(sym, cmd.sl_pips + SL_ExtraPips);
   if(slPts<=0) slPts = SB_PipsToPoints(sym, cmd.sl_pips);

   double sl = 0.0;
   if(cmd.side=="BUY")  sl = entry - (double)slPts * ptSym;
   if(cmd.side=="SELL") sl = entry + (double)slPts * ptSym;

   // TPs
   double tp1=0.0,tp2=0.0,tp3=0.0;
   if(cmd.tp1_pips>0){ int tpPts=SB_PipsToPoints(sym, cmd.tp1_pips); tp1 = (cmd.side=="BUY")? entry + (double)tpPts*ptSym : entry - (double)tpPts*ptSym; }
   if(cmd.tp2_pips>0){ int tpPts=SB_PipsToPoints(sym, cmd.tp2_pips); tp2 = (cmd.side=="BUY")? entry + (double)tpPts*ptSym : entry - (double)tpPts*ptSym; }
   if(cmd.tp3_pips>0){ int tpPts=SB_PipsToPoints(sym, cmd.tp3_pips); tp3 = (cmd.side=="BUY")? entry + (double)tpPts*ptSym : entry - (double)tpPts*ptSym; }
   entry = NormalizeDouble(entry, dgSym);
   sl    = NormalizeDouble(sl, dgSym);
   if(tp1>0.0) tp1 = NormalizeDouble(tp1, dgSym);
   if(tp2>0.0) tp2 = NormalizeDouble(tp2, dgSym);
   if(tp3>0.0) tp3 = NormalizeDouble(tp3, dgSym);


   // Lot sizing and split (same as market)
   double lotsTotal = CalcLotsByRisk(sym, (int)cmd.sl_pips);
   if(lotsTotal<=0.0){ Print("[SB|bot_ea_stable] ❌ lots <= 0"); return false; }
   double lotsEach = NormalizeVolume(sym, lotsTotal/3.0);
   if(lotsEach<=0.0) lotsEach = NormalizeVolume(sym, lotsTotal);

   // MaxSpread filter (points)
   int effMaxPts = 0;
   if(MaxSpreadPoints>0) effMaxPts = MaxSpreadPoints;
   else if(MaxSpreadPips>0.0) effMaxPts = (int)MathRound(MaxSpreadPips*10.0);
   if(effMaxPts>0 && spreadPts>effMaxPts){
      Print(StringFormat("[SB|bot_ea_stable] 🚫 MaxSpread exceeded: spreadPts=%d > %d", spreadPts, effMaxPts));
      return false;
   }

   // Decide pending type based on entry relative to current price
   bool useStop=false;
   if(cmd.side=="BUY")  useStop = (entry > ask);
   if(cmd.side=="SELL") useStop = (entry < bid);

   // Expiration
   datetime nowSrv = (datetime)TimeTradeServer();     // more reliable than TimeCurrent()
   datetime exp    = (datetime)(nowSrv + (int)EntryMaxWaitSeconds);

   // Safety: some brokers reject too-short/old expirations
   if(exp <= nowSrv + 30) exp = nowSrv + 60;

   ENUM_ORDER_TYPE_TIME ttype = ORDER_TIME_GTC;
CTrade ptrade;
   ptrade.SetExpertMagicNumber(MAGIC);
   ptrade.SetDeviationInPoints(SLIPPAGE);

   bool ok=true;
   string c1=StringFormat("%s-PND-TP1", cmd.comment);
   string c2=StringFormat("%s-PND-TP2", cmd.comment);
   string c3=StringFormat("%s-PND-TP3", cmd.comment);

   // Place 1..3 pending orders (skip TP if 0)
   if(tp1>0.0){
      bool r=false;
      if(cmd.side=="BUY")  r = (useStop? ptrade.BuyStop(lotsEach, entry, sym, sl, tp1, ttype, exp, c1) : ptrade.BuyLimit(lotsEach, entry, sym, sl, tp1, ttype, exp, c1));
      if(cmd.side=="SELL") r = (useStop? ptrade.SellStop(lotsEach, entry, sym, sl, tp1, ttype, exp, c1) : ptrade.SellLimit(lotsEach, entry, sym, sl, tp1, ttype, exp, c1));
      if(!r)
{
   int err = GetLastError();
   if(err==4756)
   {
      // invalid expiration -> retry as GTC (we will cancel manually on market execution/timeout)
      ResetLastError();
      ttype = ORDER_TIME_GTC;
      exp = 0;
      r=false;
      if(cmd.side=="BUY")  r = (useStop? ptrade.BuyStop(lotsEach, entry, sym, sl, tp1, ttype, exp, c1) : ptrade.BuyLimit(lotsEach, entry, sym, sl, tp1, ttype, exp, c1));
      if(cmd.side=="SELL") r = (useStop? ptrade.SellStop(lotsEach, entry, sym, sl, tp1, ttype, exp, c1) : ptrade.SellLimit(lotsEach, entry, sym, sl, tp1, ttype, exp, c1));
      if(!r) { ok=false; Print(StringFormat("[SB|bot_ea_stable] ❌ pending TP1 failed err=%d", GetLastError())); }
   }
   else
   {
      ok=false; Print(StringFormat("[SB|bot_ea_stable] ❌ pending TP1 failed err=%d", err));
   }
   ResetLastError();
}
   }
   if(tp2>0.0){
      bool r=false;
      if(cmd.side=="BUY")  r = (useStop? ptrade.BuyStop(lotsEach, entry, sym, sl, tp2, ttype, exp, c2) : ptrade.BuyLimit(lotsEach, entry, sym, sl, tp2, ttype, exp, c2));
      if(cmd.side=="SELL") r = (useStop? ptrade.SellStop(lotsEach, entry, sym, sl, tp2, ttype, exp, c2) : ptrade.SellLimit(lotsEach, entry, sym, sl, tp2, ttype, exp, c2));
      if(!r)
{
   int err = GetLastError();
   if(err==4756)
   {
      // invalid expiration -> retry as GTC (we will cancel manually on market execution/timeout)
      ResetLastError();
      ttype = ORDER_TIME_GTC;
      exp = 0;
      r=false;
      if(cmd.side=="BUY")  r = (useStop? ptrade.BuyStop(lotsEach, entry, sym, sl, tp2, ttype, exp, c1) : ptrade.BuyLimit(lotsEach, entry, sym, sl, tp2, ttype, exp, c1));
      if(cmd.side=="SELL") r = (useStop? ptrade.SellStop(lotsEach, entry, sym, sl, tp2, ttype, exp, c1) : ptrade.SellLimit(lotsEach, entry, sym, sl, tp2, ttype, exp, c1));
      if(!r) { ok=false; Print(StringFormat("[SB|bot_ea_stable] ❌ pending TP2 failed err=%d", GetLastError())); }
   }
   else
   {
      ok=false; Print(StringFormat("[SB|bot_ea_stable] ❌ pending TP2 failed err=%d", err));
   }
   ResetLastError();
}
   }
   if(tp3>0.0){
      bool r=false;
      if(cmd.side=="BUY")  r = (useStop? ptrade.BuyStop(lotsEach, entry, sym, sl, tp3, ttype, exp, c3) : ptrade.BuyLimit(lotsEach, entry, sym, sl, tp3, ttype, exp, c3));
      if(cmd.side=="SELL") r = (useStop? ptrade.SellStop(lotsEach, entry, sym, sl, tp3, ttype, exp, c3) : ptrade.SellLimit(lotsEach, entry, sym, sl, tp3, ttype, exp, c3));
      if(!r)
{
   int err = GetLastError();
   if(err==4756)
   {
      // invalid expiration -> retry as GTC (we will cancel manually on market execution/timeout)
      ResetLastError();
      ttype = ORDER_TIME_GTC;
      exp = 0;
      r=false;
      if(cmd.side=="BUY")  r = (useStop? ptrade.BuyStop(lotsEach, entry, sym, sl, tp3, ttype, exp, c1) : ptrade.BuyLimit(lotsEach, entry, sym, sl, tp3, ttype, exp, c1));
      if(cmd.side=="SELL") r = (useStop? ptrade.SellStop(lotsEach, entry, sym, sl, tp3, ttype, exp, c1) : ptrade.SellLimit(lotsEach, entry, sym, sl, tp3, ttype, exp, c1));
      if(!r) { ok=false; Print(StringFormat("[SB|bot_ea_stable] ❌ pending TP3 failed err=%d", GetLastError())); }
   }
   else
   {
      ok=false; Print(StringFormat("[SB|bot_ea_stable] ❌ pending TP3 failed err=%d", err));
   }
   ResetLastError();
}
   }

   Print(StringFormat("[SB|bot_ea_stable] ✅ pending placed sym=%s side=%s entry=%.2f useStop=%s exp=%s spreadPts=%d shiftPts=%d", sym, (cmd.side=="BUY"?"BUY":"SELL"), entry, (useStop?"YES":"NO"), TimeToString(exp, TIME_SECONDS), spreadPts, shiftPts));
   return ok;
}

bool SB_ClearQueueIfLastLineMatches(const string expectedLine){
   string all = SB_ReadQueueSmartCommon("softibridge/inbox/cmd_queue_mt5.txt");
   if(all=="") return false;
   string last = SB_LastNonEmptyLine(all);
   if(last=="" || last=="0") return false;
   if(last != expectedLine) return false;

   int h = FileOpen("softibridge/inbox/cmd_queue_mt5.txt", FILE_WRITE|FILE_TXT|FILE_COMMON);
   if(h==INVALID_HANDLE){
      LogLine(StringFormat("❌ [IO] clear queue failed err=%d", GetLastError()));
      ResetLastError();
      return false;
   }
   FileWriteString(h, "0\n");
   FileClose(h);
   LogLine("✅ [IO] cmd_queue_mt5 cleared");
   return true;
}

void ArmWait(const SBCommand &cmd, const string rawLine){
   g_waiting=true;
   g_wait_cmd=cmd;
   g_wait_rawline=rawLine;
   g_wait_deadline = TimeCurrent() + EntryMaxWaitSeconds;
   LogLine(StringFormat("SB WAIT ARM | sym=%s side=%s signal=%.2f maxWait=%ds", cmd.symbol, cmd.side, cmd.entry, EntryMaxWaitSeconds));
}

void ProcessWait(){
   if(!g_waiting) return;
   datetime now = TimeCurrent();
   if(now > g_wait_deadline){
      LogLine(StringFormat("SB WAIT TIMEOUT | sym=%s side=%s signal=%.2f", g_wait_cmd.symbol, g_wait_cmd.side, g_wait_cmd.entry));
      // Cancel visibility pendings on timeout (no change to trading logic, just cleanup)
      if(UsePendingVisibility){
         int n = CancelPendingByPrefix(g_wait_cmd.comment + "-PND-");
         if(n>0) LogLine(StringFormat("SB PENDING TIMEOUT CANCELLED | n=%d id=%s", n, g_wait_cmd.id));
         g_pending_placed=false; g_pending_id="";
      }
      g_waiting=false;
      if(g_wait_rawline!="") SB_ClearQueueIfLastLineMatches(g_wait_rawline);
      g_wait_rawline="";
      return;
   }
   int spr=0, dev=0; double req=0;
   if(EntryConditionsOk(g_wait_cmd, spr, dev, req)){
      LogLine(StringFormat("SB WAIT OK | sym=%s side=%s spread=%d dev=%d -> EXEC", g_wait_cmd.symbol, g_wait_cmd.side, spr, dev));
      // Cancel any visibility pendings for this signal before market execution
      if(UsePendingVisibility){
         int n = CancelPendingByPrefix(g_wait_cmd.comment + "-PND-");
         if(n>0) LogLine(StringFormat("SB PENDING CANCELLED | n=%d id=%s", n, g_wait_cmd.id));
         g_pending_placed=false;
         g_pending_id="";
      }
      bool ok = PlaceMarket3(g_wait_cmd);
      if(ok && g_wait_rawline!="") SB_ClearQueueIfLastLineMatches(g_wait_rawline);
      g_waiting=false;
      g_wait_rawline="";
   }
}

// ----------------------------
// MT5 Entry Points
// ----------------------------

double PipSize(const string sym)
{
   double pt=0.0;
   int dg=0;
   SymbolInfoDouble(sym, SYMBOL_POINT, pt);
   dg = (int)SymbolInfoInteger(sym, SYMBOL_DIGITS);
   if(dg==3 || dg==5) return pt*10.0;
   return pt;
}


bool GetBidAsk(const string sym, double &bid, double &ask)
{
   bid=0.0; ask=0.0;
   SymbolSelect(sym, true);
   MqlTick t;
   if(!SymbolInfoTick(sym, t))
      return false;
   if(t.bid<=0.0 || t.ask<=0.0)
      return false;
   bid=t.bid; ask=t.ask;
   return true;
}

int OnInit(){

   // -------- Licensing gate (SAFE) --------
   string token_json = SB_ReadAllCommon(SB_TOKEN_FILE);
   if(StringLen(token_json) <= 10){
      LogLine("E100 TOKEN MISSING: "+SB_TOKEN_FILE);
      return(INIT_FAILED);
   }

   string status = SB_JsonGetStr(token_json, "status");
   if(status == "SUSPENDED" || status == "REVOKED"){
      LogLine("E150 LICENSE BLOCKED: status="+status);
      return(INIT_FAILED);
   }

   int exp = SB_JsonGetInt(token_json, "exp");
   int grace_period = 172800; // 48 hours in seconds
   if(exp>0 && TimeCurrent() > exp + grace_period){
      LogLine("E120 TOKEN EXPIRED exp="+(string)exp+" + grace period exceeded.");
      return(INIT_FAILED);
   }

   if(exp > 0 && TimeCurrent() > exp){
      LogLine("W120 GRACE PERIOD ACTIVE. Expiry was: "+(string)exp);
      ObjectCreate(0, "SB_GRACE_WARN", OBJ_LABEL, 0, 0, 0);
      ObjectSetInteger(0, "SB_GRACE_WARN", OBJPROP_CORNER, CORNER_LEFT_UPPER);
      ObjectSetInteger(0, "SB_GRACE_WARN", OBJPROP_XDISTANCE, 20);
      ObjectSetInteger(0, "SB_GRACE_WARN", OBJPROP_YDISTANCE, 50);
      ObjectSetString(0, "SB_GRACE_WARN", OBJPROP_TEXT, "⚠️ GRACE PERIOD ACTIVE - RENEW LICENSE SOON!");
      ObjectSetInteger(0, "SB_GRACE_WARN", OBJPROP_COLOR, clrOrangeRed);
      ObjectSetInteger(0, "SB_GRACE_WARN", OBJPROP_FONTSIZE, 12);
   }

   bool mt5_allowed = SB_JsonGetBool(token_json, "mt5", true);
   if(!mt5_allowed){
      LogLine("E140 MT5 NOT ALLOWED");
      return(INIT_FAILED);
   }

   string token_install = SB_JsonGetStr(token_json, "install_id");
   string local_install = SB_ReadAllCommon(SB_INSTALL_FILE);
   StringTrimLeft(local_install);
   StringTrimRight(local_install);
   if(token_install!="" && local_install!="" && token_install!=local_install){
      LogLine("E130 INSTALL_ID MISMATCH token="+token_install+" local="+local_install);
      return(INIT_FAILED);
   }
   // --------------------------------------

   trade.SetExpertMagicNumber(MAGIC);
   trade.SetDeviationInPoints(SLIPPAGE);
   UI_CreatePanel();
   EventSetMillisecondTimer(EntryCheckMs);
   LogLine("SoftiBridge MT5 v3.17 BINREAD LASTLINE started");
      UI_CreateButtons();
return(INIT_SUCCEEDED);
}

void OnDeinit(const int reason){
   EventKillTimer();
   UI_DestroyPanel();
}

void OnTimer()
{
   ManageAutoBE();
// fast wait processing
   ProcessWait();

   // read newest command line; if changed, arm/exec
   string line="";
   if(!ReadNewestQueueLine(line)) return;

   SBCommand cmd;
   if(!ParseKVLine(line, cmd)) return;

   // If already waiting for same id, ignore
   if(g_waiting && cmd.id==g_wait_cmd.id) return;

   int spr=0, dev=0; double req=0;
   if(EntryConditionsOk(cmd, spr, dev, req)){
      bool ok = PlaceMarket3(cmd);
      if(ok) SB_ClearQueueIfLastLineMatches(line);
   } else {
      // MT4-like visibility: show pending orders (optional) AND keep WAIT cycle
      if(UsePendingVisibility){
         // Place pending only once per signal id
         if(!g_pending_placed || g_pending_id != cmd.id){
            bool ok = PlacePending3(cmd);
            if(ok){
               g_pending_placed=true;
               g_pending_id=cmd.id;
            }
         }
      }
      // Arm WAIT so it will execute market when conditions are OK (cycle)
      ArmWait(cmd, line);
      // Do NOT clear queue here: it will be cleared only when executed or timeout.
   }
}


void ManageAutoBE()
{
   if(!AutoBE) return;
   string sym = _Symbol; // manage only current chart symbol (consistent with existing EA)
   double pip = PipSize(sym);
   double pt  = 0.0;
   int dg = 0;
   SymbolInfoDouble(sym, SYMBOL_POINT, pt);
   dg = (int)SymbolInfoInteger(sym, SYMBOL_DIGITS);

   // stop level in points
   int stopLevelPts = (int)SymbolInfoInteger(sym, SYMBOL_TRADE_STOPS_LEVEL);
   double stopLevelPrice = stopLevelPts * pt;

   for(int i=PositionsTotal()-1; i>=0; i--)
   {
      ulong pticket = PositionGetTicket(i);
       if(pticket==0) continue;
       if(!PositionSelectByTicket(pticket)) continue;
      string psym = PositionGetString(POSITION_SYMBOL);
      if(psym != sym) continue;
      long   magic = (long)PositionGetInteger(POSITION_MAGIC);
      if(magic != MAGIC) continue;

      long type = PositionGetInteger(POSITION_TYPE);
      if(type != POSITION_TYPE_BUY && type != POSITION_TYPE_SELL) continue;

      double op = PositionGetDouble(POSITION_PRICE_OPEN);
      double sl = PositionGetDouble(POSITION_SL);
      double tp = PositionGetDouble(POSITION_TP);

      double bid=0.0, ask=0.0;
      if(!GetBidAsk(sym, bid, ask)) { Print(StringFormat("[SB|bot_ea_stable] NO_TICK | sym=%s -> WAIT", sym)); return; }

      double profitPips = (type==POSITION_TYPE_BUY) ? ((bid-op)/pip) : ((op-ask)/pip);
      if(profitPips < (double)BE_MinPips) continue;

      double be = op + (type==POSITION_TYPE_BUY ? (BE_OffsetPoints*pt) : -(BE_OffsetPoints*pt));

      // Already protected?
      if(type==POSITION_TYPE_BUY)
      {
         if(sl >= be - (0.5*pt) && sl != 0.0) continue;
         double maxSL = bid - stopLevelPrice;
         if(be > maxSL) be = maxSL;
      }
      else
      {
         if(sl <= be + (0.5*pt) && sl != 0.0) continue;
         double minSL = ask + stopLevelPrice;
         if(be < minSL) be = minSL;
      }

      be = NormalizeDouble(be, dg);

      MqlTradeRequest req;
      MqlTradeResult  res;
      ZeroMemory(req); ZeroMemory(res);
      req.action = TRADE_ACTION_SLTP;
      req.symbol = sym;
      req.magic  = MAGIC;
      req.position = (ulong)PositionGetInteger(POSITION_TICKET);
      req.sl = be;
      req.tp = tp;

      bool sent = OrderSend(req, res);
          if(!sent){ Print("OrderSend FAILED. Error: ", GetLastError()); }
}
}

void OnTick()
{
   ManageAutoBE();
// ultra-fast recheck while waiting
   if(g_waiting) ProcessWait();
}