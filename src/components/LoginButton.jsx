import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { login, register, logout, getCurrentUser } from "../config/appwrite";
import { setUser, clearUser, syncUserData } from "../store/slices/authSlice";
import { setProducts } from "../store/slices/inventorySlice";
import { loadSales } from "../store/slices/salesSlice";
import { setPurchases } from "../store/slices/purchaseSlice";
import { setExpenses } from "../store/slices/expenseSlice";
import { updateProfilePictureUrl } from "../store/slices/userSlice";
import ImageUploader from "./profile/ImageUploader";
import ProfilePicture from "./profile/ProfilePicture";
import eyeOpen from "../assets/eyeopen.svg";
import eyeClose from "../assets/eyeclose.svg";
import triangle from "../assets/triangle.svg";
import editIcon from "../assets/edit.svg";
import illustartion from "../assets/illustration.png";
import { resetInitialDataFlag } from "../store/middleware/localStorageMiddleware";

// eslint-disable-next-line react/prop-types
export default function LoginButton({ isCollapsed }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "", name: "" });

  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const syncing = useSelector((state) => state.auth.syncing);
  const profilePictureUrl = useSelector((state) => state.userdata.profilePictureUrl);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await getCurrentUser();
        if (response.success) {
          dispatch(setUser(response.data));
          resetInitialDataFlag();
          await dispatch(syncUserData());
        }
      } catch {
        // Not logged in
      }
    };
    if (!user) checkSession();
  }, [dispatch, user]);

  // Restore session data from sessionStorage
  const syncSessionData = async () => {
    const inventory = sessionStorage.getItem("pos_inventory");
    const sales     = sessionStorage.getItem("pos_sales");
    const purchases = sessionStorage.getItem("pos_purchases");
    const expenses  = sessionStorage.getItem("pos_expenses");
    let hasData = false;

    if (inventory) { const d = JSON.parse(inventory); if (d.products?.length)   { dispatch(setProducts(d.products));     hasData = true; } }
    if (sales)     { const d = JSON.parse(sales);     if (d.sales?.length)       { dispatch(loadSales(d.sales));         hasData = true; } }
    if (purchases) { const d = JSON.parse(purchases); if (d.purchases?.length)   { dispatch(setPurchases(d.purchases));   hasData = true; } }
    if (expenses)  { const d = JSON.parse(expenses);  if (Object.keys(d).length) { dispatch(setExpenses(d));             hasData = true; } }

    if (!hasData) {
      resetInitialDataFlag();
      await dispatch(syncUserData());
    }
    sessionStorage.clear();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      if (isLogin) {
        const response = await login(formData.email, formData.password);
        if (response.success) {
          dispatch(setUser(response.data));
          await syncSessionData();
          setIsModalOpen(false);
          setFormData({ email: "", password: "", name: "" });
        } else {
          setError(response.error || "Invalid email or password");
        }
      } else {
        const response = await register(formData.email, formData.password, formData.name);
        if (response.success) {
          dispatch(setUser(response.data));
          resetInitialDataFlag();
          await dispatch(syncUserData());
          setIsModalOpen(false);
          setFormData({ email: "", password: "", name: "" });
        } else {
          setError(response.error || "Registration failed");
        }
      }
    } catch (err) {
      setError("An unexpected error occurred: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await logout();
      dispatch(clearUser());
      sessionStorage.clear();
      window.location.reload();
    } catch {
      setError("Failed to logout");
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfilePictureSuccess = (fileUrl) => {
    dispatch(updateProfilePictureUrl(fileUrl));
  };

  const resetForm = () => {
    setIsModalOpen(false);
    setError("");
    setFormData({ email: "", password: "", name: "" });
  };

  return (
    <div className="fixed top-[65px] sm:right-6 right-[5px] shadow sm:rounded-[10px] rounded-[6px] p-0 z-20">
      {user ? (
        <div className={`p-3 w-[332px] bg-white sm:rounded-[10px] rounded-[6px] relative${isCollapsed ? " items-center" : ""}`}>
          <img src={triangle} alt="▲" className="absolute top-[-8px] right-[21px]" />
          <div
            className={`flex items-center relative ${isCollapsed ? "justify-center" : "mb-3"}`}
            onClick={() => setIsProfileModalOpen(true)}
            role="button"
            tabIndex={0}
          >
            <ProfilePicture url={profilePictureUrl} size={isCollapsed ? "small" : "medium"} />
            <span className="h-[18px] w-[18px] rounded-full bg-[#9747ff] flex align-middle justify-center absolute top-[50px] left-[53px] z-10">
              <img src={editIcon} alt="edit" className="w-[10px]" />
            </span>
            {!isCollapsed && (
              <div className="ml-3 overflow-hidden">
                <p className="text-[20px] font-poppins font-[500] text-black truncate m-0">{user.name || "User"}</p>
                <p className="text-[13px] font-[400] text-[#9747ff] truncate m-[-7px_0_0_0]">{user.email}</p>
                {user.role && (
                  <span className="inline-block mt-1 px-2 py-0.5 text-[10px] rounded-full bg-violet-100 text-violet-700 font-semibold capitalize">{user.role}</span>
                )}
                {syncing && <p className="text-xs text-blue-500 mt-0.5">Syncing data...</p>}
              </div>
            )}
          </div>
          <div className="flex justify-evenly">
            <Link
              key="/settings"
              to="/settings"
              className="sm:hidden w-2/5 px-4 py-2 flex items-center justify-center bg-white text-black border border-black focus:bg-black focus:text-white rounded-lg transition-colors"
            >
              Settings
            </Link>
            <button
              onClick={handleLogout}
              disabled={isLoading}
              className={`w-2/5 sm:w-full flex items-center justify-center bg-[#ff5364] text-white rounded-lg hover:bg-[#d14452] transition-colors ${isCollapsed ? "p-2" : "px-4 py-2"}`}
            >
              {isLoading ? (
                <div className="animate-spin h-5 w-5 border-2 border-white rounded-full" />
              ) : isCollapsed ? (
                <span className="sr-only">Logout</span>
              ) : (
                "Logout"
              )}
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => { setIsModalOpen(true); setIsLogin(true); }}
          className={`w-24 flex items-center justify-center bg-[#9747ff] text-white font-poppins font-semibold text-sm rounded-[30px] hover:bg-[#5d1d95] transition-colors fixed sm:top-3 top-[10px] right-6 ${isCollapsed ? "p-2" : "px-4 py-2"}`}
        >
          {isCollapsed ? <span className="sr-only">Login</span> : "Sign Up!"}
        </button>
      )}

      {/* ── Profile Modal ─────────────────────────────────────────────── */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black opacity-50" />
            <div className="relative bg-white rounded-lg p-8 max-w-md w-full">
              <button
                onClick={() => setIsProfileModalOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <h2 className="text-2xl font-bold mb-6">Profile Settings</h2>
              <div className="space-y-6">
                <ImageUploader
                  userId={user?.id}
                  onUploadSuccess={handleProfilePictureSuccess}
                  currentImageId={user?.profileImageId}
                />
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <p className="mt-1 text-gray-900">{user?.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="mt-1 text-gray-900">{user?.email}</p>
                  </div>
                  {user?.role && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Role</label>
                      <p className="mt-1 text-gray-900 capitalize">{user.role}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Login / Register Modal ────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-[#ffffff7b] backdrop-blur-sm" />
            <div className="relative bg-white p-0 lg:max-w-[70%] max-w-full w-full h-[80vh] rounded-xl shadow-lg flex lg:flex-row flex-col items-center justify-center overflow-hidden">
              <button
                onClick={resetForm}
                className="absolute top-3 right-3 w-10 h-10 flex items-center justify-center rounded-full text-black bg-white z-10"
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Form side */}
              <div className="flex flex-col gap-4 items-center justify-center lg:w-3/5 w-full px-6">
                <h2 className="text-center text-black text-5xl font-bold font-['Poppins']">
                  {isLogin ? "Login" : "Sign Up"}
                </h2>

                {/* Demo credentials hint */}
                {isLogin && (
                  <div className="w-9/12 text-xs text-center text-gray-500 bg-gray-50 rounded-lg p-2 border border-dashed border-gray-200">
                    <span className="font-semibold text-violet-600">Demo:</span>{" "}
                    admin@pos.local / Admin@123
                  </div>
                )}

                {error && (
                  <div className="p-3 bg-red-50 text-red-700 rounded-[6px] w-9/12 text-sm">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4 w-full">
                  {/* Name field (register only) */}
                  {!isLogin && (
                    <div className="flex items-center flex-col">
                      <span className="w-9/12 flex flex-col">
                        <label className="block text-black/50 text-xs font-bold font-poppins pl-4">
                          Full Name
                        </label>
                        <input
                          id="auth-name"
                          type="text"
                          required
                          className="h-10 w-full bg-[#e6e9f3] rounded-[30px] border-2 focus:border-[#9747ff] focus:outline-none indent-4"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Your full name"
                        />
                      </span>
                    </div>
                  )}

                  {/* Email */}
                  <div className="flex items-center flex-col">
                    <span className="w-9/12 flex flex-col">
                      <label className="block text-black/50 text-xs font-bold font-poppins pl-4">Email</label>
                      <input
                        id="auth-email"
                        type="email"
                        required
                        className="h-10 w-full bg-[#e6e9f3] rounded-[30px] border-2 focus:border-[#9747ff] focus:outline-none indent-4"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="you@example.com"
                      />
                    </span>
                  </div>

                  {/* Password */}
                  <div className="flex items-center flex-col">
                    <span className="w-9/12 flex flex-col">
                      <label className="block text-black/50 text-xs font-bold font-poppins pl-4">Password</label>
                      <div className="relative w-full">
                        <input
                          id="auth-password"
                          type={showPassword ? "text" : "password"}
                          required
                          className="h-10 w-full bg-[#e6e9f3] rounded-[30px] border-2 focus:border-[#9747ff] focus:outline-none indent-4 pr-10"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          placeholder={isLogin ? "••••••••" : "Min. 6 characters"}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-[21px] transform -translate-y-1/2 text-gray-500 hover:text-black focus:outline-none"
                        >
                          {showPassword ? <img src={eyeOpen} alt="show" /> : <img src={eyeClose} alt="hide" />}
                        </button>
                      </div>
                    </span>
                  </div>

                  {/* Submit */}
                  <div className="flex items-center justify-center">
                    <button
                      id="auth-submit"
                      type="submit"
                      disabled={isLoading}
                      className="w-[103px] h-10 bg-[#9747ff] rounded-[30px] text-white font-semibold flex items-center justify-center hover:bg-[#7d35d6] transition-colors"
                    >
                      {isLoading ? (
                        <div className="animate-spin h-5 w-5 border-2 border-white rounded-full" />
                      ) : isLogin ? "Login" : "Sign Up"}
                    </button>
                  </div>

                  {/* Toggle login/register */}
                  <div className="text-center">
                    <button
                      type="button"
                      className="text-sm text-black"
                      onClick={() => { setIsLogin(!isLogin); setError(""); }}
                    >
                      {isLogin ? "Don't have an account? " : "Already have an account? "}
                      <b className="text-[#9747ff] font-medium hover:text-[#a058fe]">
                        {isLogin ? "Sign Up" : "Login"}
                      </b>
                    </button>
                  </div>
                </form>
              </div>

              {/* Illustration side */}
              <div className="lg:flex hidden flex-col items-center justify-center w-2/5 bg-[#9747ff] h-full">
                <img src={illustartion} alt="illustration" className="w-auto h-3/5" />
                <div className="text-center text-white text-base font-bold font-poppins">
                  Manage your whole business in 1 place!
                </div>
                <div className="pl-1 pr-1 mt-2 text-center text-white text-xs font-poppins leading-[15px]">
                  Order up is your one stop shop to get free of all the difficult and complex business management.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
