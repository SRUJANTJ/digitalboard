import { getUserFromReq } from "../lib/auth";

export async function getServerSideProps({ req }) {
  const user = getUserFromReq(req);
  if (!user) {
    return { redirect: { destination: "/login", permanent: false } };
  }
  return {
    redirect: {
      destination: user.role === "student" ? "/dashboard" : "/admin",
      permanent: false,
    },
  };
}

export default function Index() {
  return null;
}
