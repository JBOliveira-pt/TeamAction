import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    async redirects() {
        return [
            {
                source: "/dashboard/atleta/perfil",
                destination: "/dashboard/utilizador/perfil",
                permanent: true,
            },
        ];
    },
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "i.ytimg.com",
            },
            {
                protocol: "https",
                hostname: "pub-5de44bde848c4dbcabd75025afe46c7e.r2.dev",
            },
            {
                protocol: "https",
                hostname: "img.clerk.com",
            },
        ],
    },
};

export default nextConfig;
