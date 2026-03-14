import CustomSignUpForm from "@/app/ui/signup/custom-signup-form";

export default function SignUpPage() {
    return (
        <main
            className="min-h-screen p-6 flex items-center justify-center bg-cover bg-center bg-no-repeat"
            style={{
                backgroundImage:
                    "url('https://pub-5de44bde848c4dbcabd75025afe46c7e.r2.dev/teamaction-images/teamaction-login-background.png')",
            }}
        >
            <CustomSignUpForm />
        </main>
    );
}
