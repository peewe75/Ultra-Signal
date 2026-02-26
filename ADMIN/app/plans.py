def limits_for_plan(plan: str):
    p = (plan or "").upper()
    if p == "BASIC": return (1, 1)
    if p == "PRO": return (3, 3)
    if p == "ENTERPRISE": return (10, 10)
    return (1, 1)

def valid_plans():
    return ("BASIC","PRO","ENTERPRISE")
