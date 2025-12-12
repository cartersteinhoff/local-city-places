import useSWR from "swr";

interface User {
  email: string;
  role: "admin" | "merchant" | "member";
  profilePhotoUrl?: string | null;
}

interface Member {
  firstName: string;
  lastName: string;
}

interface AuthData {
  user: User;
  member?: Member;
}

const fetcher = async (url: string): Promise<AuthData | null> => {
  const res = await fetch(url);
  if (!res.ok) return null;
  return res.json();
};

export function useUser() {
  const { data, error, isLoading, mutate } = useSWR<AuthData | null>(
    "/api/auth/me",
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000, // Dedupe requests within 60s
    }
  );

  const userName = data?.member
    ? `${data.member.firstName} ${data.member.lastName}`
    : undefined;

  return {
    user: data?.user,
    member: data?.member,
    userName,
    isLoading,
    isAuthenticated: !!data?.user,
    error,
    mutate,
  };
}
