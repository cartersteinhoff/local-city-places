import useSWR from "swr";

interface User {
  email: string;
  role: "admin" | "merchant" | "member";
  firstName?: string | null;
  lastName?: string | null;
  profilePhotoUrl?: string | null;
}

interface Member {
  id: string;
}

interface Merchant {
  id: string;
  businessName: string;
}

interface AuthData {
  user: User;
  member?: Member;
  merchant?: Merchant;
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
      dedupingInterval: 60000,
    }
  );

  const userName = data?.user?.firstName && data?.user?.lastName
    ? `${data.user.firstName} ${data.user.lastName}`
    : data?.merchant?.businessName || undefined;

  return {
    user: data?.user,
    member: data?.member,
    merchant: data?.merchant,
    userName,
    isLoading,
    isAuthenticated: !!data?.user,
    error,
    mutate,
  };
}
