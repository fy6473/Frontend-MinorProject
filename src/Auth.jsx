import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Context } from "./context/Context";

const Auth = () => {
    const contextValue = useContext(Context);

    if (!contextValue) {
        return <div>Loading...</div>;
    }

    const { login, register } = contextValue;

    const navigate = useNavigate();

    const [isLogin, setIsLogin] = useState(true);

    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
    });

    const [error, setError] = useState("");

    const handleSubmit = async (e) => {

        e.preventDefault();

        let result;

        if (isLogin) {
            result = await login(formData.email, formData.password);
        } else {
            result = await register(
                formData.username,
                formData.email,
                formData.password
            );
        }

        if (result.success) {
            navigate("/");
        } else {
            setError(result.message);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-900">
            <div className="w-full max-w-md p-6 bg-slate-800 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold text-white mb-6 text-center">
                    {isLogin ? "Login" : "Register"}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {!isLogin && (
                        <input
                            name="username"
                            placeholder="Username"
                            className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            onChange={(e) =>
                                setFormData({ ...formData, username: e.target.value })
                            }
                        />
                    )}

                    <input
                        name="email"
                        type="email"
                        placeholder="Email"
                        className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onChange={(e) =>
                            setFormData({ ...formData, email: e.target.value })
                        }
                    />

                    <input
                        type="password"
                        name="password"
                        placeholder="Password"
                        className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onChange={(e) =>
                            setFormData({ ...formData, password: e.target.value })
                        }
                    />

                    <button
                        type="submit"
                        className="w-full py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
                    >
                        {isLogin ? "Login" : "Register"}
                    </button>
                </form>

                {error && <p className="text-red-500 text-center mt-4">{error}</p>}

                <button
                    onClick={() => {
                        setIsLogin(!isLogin);
                        setError("");
                    }}
                    className="w-full mt-4 py-2 bg-slate-700 text-gray-300 font-semibold rounded-lg hover:bg-slate-600 transition"
                >
                    {isLogin ? "Create account" : "Already have account"}
                </button>
            </div>
        </div>
    );
};

export default Auth;