export const validateRegister = (req, res, next) => {
  const { email, username, password, confirmPassword } = req.body;

  // Stage A: OTP Request (POST /auth/register/request-otp or requests containing only email)
  if (req.path.includes("request-otp") || (email && !username && !password)) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email?.trim() || !emailRegex.test(email.trim())) {
      return res.status(400).render("auth/register", {
        step: "email",
        email: email?.trim() || "",
        message: "Please enter a valid email address",
      });
    }
    return next();
  }
  

  // Stage B: Final Account Creation (POST /auth/register)
  if (!username?.trim() || !password?.trim()) {
    return res.status(400).render("auth/register", {
      step: "details",
      message: "All fields are required",
    });
  }

  if (confirmPassword !== undefined && password !== confirmPassword) {
    return res.status(400).render("auth/register", {
      step: "details",
      message: "Passwords do not match",
    });
  }

  next();
};

export const validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  if (!email?.trim() || !password?.trim()) {
    return res
      .status(400)
      .render("auth/login", { message: "All fields are required" });
  }
  next();
};
