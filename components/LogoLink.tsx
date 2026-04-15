import Link from "next/link";
import Logo from "@/components/Logo";

export default function LogoLink({ href }: { href?: string }) {
  return (
    <Link href={`${href ?? "/"}`}>
      <Logo />
    </Link>
  );
}
