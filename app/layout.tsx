export const metadata = {
  title: "BTS Environment Management System API",
  description: "Backend API for BTS intrusion alert notifications.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
