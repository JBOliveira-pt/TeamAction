import Image from "next/image";

export default function TeamActionLogo() {
    return (
        <div className="flex items-center gap-2">
            {/* Logo com suporte a dark/light mode */}
            <Image
                src="https://pub-5de44bde848c4dbcabd75025afe46c7e.r2.dev/teamaction-images/teamaction-logo-black.png"
                alt="TeamAction Logo"
                width={80}
                height={80}
                className="dark:hidden"
            />
            <Image
                src="https://pub-5de44bde848c4dbcabd75025afe46c7e.r2.dev/teamaction-images/teamaction-logo-white.png"
                alt="TeamAction Logo"
                width={80}
                height={80}
                className="hidden dark:block"
            />
        </div>
    );
}
