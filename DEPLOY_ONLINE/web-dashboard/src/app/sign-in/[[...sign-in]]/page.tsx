import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <SignIn appearance={{
        elements: {
          rootBox: "mx-auto",
          card: "bg-zinc-950 border border-white/10 shadow-2xl",
          headerTitle: "text-white",
          headerSubtitle: "text-gray-400",
          socialButtonsBlockButton: "bg-zinc-900 border-white/10 text-white hover:bg-zinc-800",
          dividerLine: "bg-white/10",
          dividerText: "text-gray-500",
          formFieldLabel: "text-gray-300",
          formFieldInput: "bg-black border-white/10 text-white focus:border-blue-500",
          formButtonPrimary: "bg-blue-600 hover:bg-blue-700 text-white",
          footerActionText: "text-gray-400",
          footerActionLink: "text-blue-500 hover:text-blue-400",
        }
      }} />
    </div>
  );
}