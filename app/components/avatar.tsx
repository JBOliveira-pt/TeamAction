import Image from "next/image";

interface AvatarProps {
  src?: string;
  alt?: string;
  fallback?: string;
  className?: string;
}

export function Avatar({ src, alt = "Avatar", fallback = "US", className = "" }: AvatarProps) {
  return (
    <div className={`relative h-9 w-9 rounded-full overflow-hidden border border-gray-700 bg-gray-800 ${className}`}>
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-600 text-white text-sm font-medium">
          {fallback}
        </div>
      )}
    </div>
  );
}