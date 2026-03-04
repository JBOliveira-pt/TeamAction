import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
    return (
        <main className="flex min-h-screen items-center justify-center p-6 bg-gray-950">
            <SignUp
                appearance={{
                    elements: {
                        formButtonPrimary: "bg-blue-600 hover:bg-blue-700",
                        card: "bg-gray-900 border border-gray-800",
                        headerTitle: "text-white",
                        headerSubtitle: "text-gray-400",
                        socialButtonsBlockButton:
                            "border-gray-700 text-white hover:bg-gray-800",
                        formFieldLabel: "text-gray-300",
                        formFieldInput:
                            "bg-gray-800 border-gray-700 text-white",
                        footerActionLink: "text-blue-400 hover:text-blue-300",
                    },
                }}
            />
        </main>
    );
}
