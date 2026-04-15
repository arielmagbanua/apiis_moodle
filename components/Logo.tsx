import Image from "next/image";

export default function Logo() {
  return (
    <Image
      src="/apiis_logo.png"
      alt="APIIS logo"
      width={280}
      height={70}
      priority
    />
  );
}
