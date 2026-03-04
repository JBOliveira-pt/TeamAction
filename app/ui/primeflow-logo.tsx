import Image from "next/image";

export default function PrimeflowLogo() {
    return (
        <div className="flex items-center gap-2">
            {/* Logo com suporte a dark/light mode */}
            <Image
                src="https://pub-b07f842ba4ae41bc8cf97ca6adeff08b.r2.dev/primeflow-images/primeflow-whiteroundlogo-nobg.png"
                alt="PrimeFlow Logo"
                width={80}
                height={80}
                className="dark:hidden"
            />
            <Image
                src="https://pub-b07f842ba4ae41bc8cf97ca6adeff08b.r2.dev/primeflow-images/primeflow-darkroundlogo-nobg.png"
                alt="PrimeFlow Logo"
                width={80}
                height={80}
                className="hidden dark:block"
            />
        </div>
    );
}
