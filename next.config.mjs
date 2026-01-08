/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "arweave.net",
      },
      {
        protocol: "https",
        hostname: "*.ipfs.nftstorage.link",
      },
      {
        protocol: "https",
        hostname: "bafkreibk3covs5ltyqxa272uodhber6jqd3ahmbqdczjrf4pn55kyy3oga.ipfs.nftstorage.link",
      },
      {
        protocol: "https",
        hostname: "bafkreidvkvuzyslw5jh5z242lgzwzhbi2kxxnpkic5wsvyno5ikvpr7rqu.ipfs.nftstorage.link",
      },
      {
        protocol: "https",
        hostname: "bafkreihqhwhhrm2ebnklcfed7hx2kxisjvmqcxwvqodugcdpxvhnshtvay.ipfs.nftstorage.link",
      },
      {
        protocol: "https",
        hostname: "bafkreifelh24vd4l77iy3j5j2qnhfuocjvqewo3xmqsrdg37yuug7kgpui.ipfs.nftstorage.link",
      },
      {
        protocol: "https",
        hostname: "dd.dexscreener.com",
      },
    ],
  },
};

export default nextConfig;
