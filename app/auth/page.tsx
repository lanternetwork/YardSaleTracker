import AuthPageServer from './AuthPageServer'

interface AuthPageProps {
  searchParams: { returnTo?: string; error?: string }
}

export default function AuthPage({ searchParams }: AuthPageProps) {
  return <AuthPageServer searchParams={searchParams} />
}
