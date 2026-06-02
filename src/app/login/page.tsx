import Link from "next/link";
import { AuthForm } from "@/components/auth-form";

export default function LoginPage() {
  return (
    <>
      <AuthForm mode="login" />
      <Link className="sr-only" href="/register">Criar conta</Link>
    </>
  );
}
