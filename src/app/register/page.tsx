import Link from "next/link";
import { AuthForm } from "@/components/auth-form";

export default function RegisterPage() {
  return (
    <>
      <AuthForm mode="register" />
      <Link className="sr-only" href="/login">Entrar</Link>
    </>
  );
}
