export default function Welcome() {
  return (
    <div className="h-screen bg-yellow-400 flex flex-col justify-center items-center text-center p-6">
      <h1 className="text-4xl font-extrabold text-white drop-shadow-lg">
        Welcome to TRACKIFY Ride Aapp
      </h1>

      <p className="text-white mt-3 text-lg">Fast · Safe · Reliable</p>

      <div className="mt-10 flex flex-col gap-4 w-full max-w-sm">
        <a href="/login?role=rider" className="bg-white text-black py-3 rounded-xl font-semibold shadow">
          Login as Rider
        </a>

        <a href="/login?role=driver" className="bg-black text-white py-3 rounded-xl font-semibold shadow">
          Login as Driver
        </a>

        <a href="/register" className="text-white underline mt-3">
          Create an Account →
        </a>
      </div>
    </div>
  );
}
