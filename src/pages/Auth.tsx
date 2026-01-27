import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ArrowLeft, Smartphone, User, Mail, Phone } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import logo from "@/assets/logo.jpg";

const generateRandomOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const Auth = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  
  // Signup states
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPhone, setSignupPhone] = useState("");
  const [signupStep, setSignupStep] = useState<"details" | "otp">("details");
  const [signupOtp, setSignupOtp] = useState("");
  const [signupGeneratedOtp, setSignupGeneratedOtp] = useState("");
  
  // Login states
  const [loginPhone, setLoginPhone] = useState("");
  const [loginOtpSent, setLoginOtpSent] = useState(false);
  const [loginOtpValue, setLoginOtpValue] = useState("");
  const [loginGeneratedOtp, setLoginGeneratedOtp] = useState("");

  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!signupName.trim()) {
      toast.error("Please enter your name");
      return;
    }
    if (!signupPhone || signupPhone.length < 10) {
      toast.error("Please enter a valid phone number");
      return;
    }
    if (!signupEmail || !signupEmail.includes("@")) {
      toast.error("Please enter a valid email");
      return;
    }

    const newOtp = generateRandomOTP();
    setSignupGeneratedOtp(newOtp);
    setSignupStep("otp");
    toast.success(`OTP sent to ${signupPhone}. Your code: ${newOtp}`);
  };

  const handleSignupVerify = async () => {
    if (signupOtp !== signupGeneratedOtp) {
      toast.error("Invalid OTP. Please try again.");
      return;
    }

    setIsLoading(true);

    try {
      // Always use phone-based email for auth consistency between signup and login
      const authEmail = `${signupPhone.replace(/\D/g, '')}@otp.demo`;
      const authPassword = `otp_${signupPhone.replace(/\D/g, '')}_secure`;

      const { error } = await supabase.auth.signUp({
        email: authEmail,
        password: authPassword,
        options: {
          data: {
            full_name: signupName,
            phone: signupPhone,
            email: signupEmail, // Store real email in metadata
            role: "customer",
          },
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (error) throw error;

      toast.success("Account created successfully!");
      navigate("/");
    } catch (error: any) {
      if (error.message.includes("already registered")) {
        toast.error("This phone/email is already registered. Try logging in.");
      } else {
        toast.error(error.message || "Failed to create account");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const phoneDigits = loginPhone.replace(/\D/g, "");

    if (!phoneDigits || phoneDigits.length < 10) {
      toast.error("Please enter a valid phone number");
      return;
    }

    setIsLoading(true);

    try {
      const newOtp = generateRandomOTP();
      setLoginGeneratedOtp(newOtp);
      setLoginOtpSent(true);
      toast.success(`OTP sent to ${loginPhone}. Your code: ${newOtp}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to send OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginVerify = async () => {
    if (loginOtpValue !== loginGeneratedOtp) {
      toast.error("Invalid OTP. Please try again.");
      return;
    }

    setIsLoading(true);
    
    const demoEmail = `${loginPhone.replace(/\D/g, '')}@otp.demo`;
    const demoPassword = `otp_${loginPhone.replace(/\D/g, '')}_secure`;

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: demoEmail,
        password: demoPassword,
      });

      if (signInError) {
        toast.error("Account not found. Please sign up first.");
        return;
      }

      toast.success("Login successful!");
      navigate("/");
    } catch (error: any) {
      toast.error(error.message || "Failed to login");
    } finally {
      setIsLoading(false);
    }
  };

  const resetSignup = () => {
    setSignupStep("details");
    setSignupOtp("");
    setSignupGeneratedOtp("");
  };

  const resetLogin = () => {
    setLoginOtpSent(false);
    setLoginOtpValue("");
    setLoginGeneratedOtp("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-muted via-background to-muted p-4">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center mb-8 gap-3">
          <img src={logo} alt="Scrapy5 Logo" className="h-16 w-auto object-contain" />
        </Link>

        <Card className="shadow-elevated border-0">
          <CardHeader className="pb-4 text-center">
            <CardTitle className="text-2xl">Welcome</CardTitle>
            <CardDescription>Sign in or create an account to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6 h-12">
                <TabsTrigger value="login" className="text-sm font-medium">Login</TabsTrigger>
                <TabsTrigger value="signup" className="text-sm font-medium">Sign Up</TabsTrigger>
              </TabsList>

              {/* LOGIN TAB */}
              <TabsContent value="login" className="space-y-4">
                {!loginOtpSent ? (
                  <form onSubmit={handleLoginSendOtp} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="login-phone" className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        Mobile Number
                      </Label>
                      <Input
                        id="login-phone"
                        type="tel"
                        placeholder="+91 9876543210"
                        value={loginPhone}
                        onChange={(e) => setLoginPhone(e.target.value)}
                        required
                        className="h-12 text-base"
                      />
                    </div>
                    <Button type="submit" className="w-full h-12 text-base font-medium" disabled={isLoading}>
                      <Smartphone className="h-4 w-4 mr-2" />
                      {isLoading ? "Checking..." : "Send OTP"}
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                      We'll send you a one-time password to verify your number
                    </p>
                  </form>
                ) : (
                  <div className="space-y-6">
                    <Button
                      variant="ghost"
                      className="w-fit p-0 h-auto"
                      onClick={resetLogin}
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Change number
                    </Button>
                    
                    <div className="text-center space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Enter the 6-digit code sent to
                      </p>
                      <p className="font-semibold text-foreground">{loginPhone}</p>
                    </div>

                    <div className="flex justify-center">
                      <InputOTP
                        maxLength={6}
                        value={loginOtpValue}
                        onChange={setLoginOtpValue}
                      >
                        <InputOTPGroup>
                          <InputOTPSlot index={0} />
                          <InputOTPSlot index={1} />
                          <InputOTPSlot index={2} />
                          <InputOTPSlot index={3} />
                          <InputOTPSlot index={4} />
                          <InputOTPSlot index={5} />
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                    
                    <Button 
                      onClick={handleLoginVerify} 
                      className="w-full h-12 text-base font-medium" 
                      disabled={loginOtpValue.length !== 6 || isLoading}
                    >
                      {isLoading ? "Verifying..." : "Verify & Login"}
                    </Button>

                    <p className="text-xs text-muted-foreground text-center">
                      Your OTP: <span className="font-mono font-bold text-primary text-sm">{loginGeneratedOtp}</span>
                    </p>
                  </div>
                )}
              </TabsContent>

              {/* SIGNUP TAB */}
              <TabsContent value="signup" className="space-y-4">
                {signupStep === "details" ? (
                  <form onSubmit={handleSignupSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name" className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        Full Name
                      </Label>
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="John Doe"
                        value={signupName}
                        onChange={(e) => setSignupName(e.target.value)}
                        required
                        className="h-12 text-base"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-phone" className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        Mobile Number
                      </Label>
                      <Input
                        id="signup-phone"
                        type="tel"
                        placeholder="+91 9876543210"
                        value={signupPhone}
                        onChange={(e) => setSignupPhone(e.target.value)}
                        required
                        className="h-12 text-base"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-email" className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        Email Address
                      </Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="you@example.com"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        required
                        className="h-12 text-base"
                      />
                    </div>

                    <Button type="submit" className="w-full h-12 text-base font-medium">
                      Continue
                    </Button>
                  </form>
                ) : (
                  <div className="space-y-6">
                    <Button
                      variant="ghost"
                      className="w-fit p-0 h-auto"
                      onClick={resetSignup}
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to details
                    </Button>
                    
                    <div className="text-center space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Enter the 6-digit code sent to
                      </p>
                      <p className="font-semibold text-foreground">{signupPhone}</p>
                    </div>

                    <div className="flex justify-center">
                      <InputOTP
                        maxLength={6}
                        value={signupOtp}
                        onChange={setSignupOtp}
                      >
                        <InputOTPGroup>
                          <InputOTPSlot index={0} />
                          <InputOTPSlot index={1} />
                          <InputOTPSlot index={2} />
                          <InputOTPSlot index={3} />
                          <InputOTPSlot index={4} />
                          <InputOTPSlot index={5} />
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                    
                    <Button 
                      onClick={handleSignupVerify} 
                      className="w-full h-12 text-base font-medium" 
                      disabled={signupOtp.length !== 6 || isLoading}
                    >
                      {isLoading ? "Creating Account..." : "Verify & Create Account"}
                    </Button>

                    <p className="text-xs text-muted-foreground text-center">
                      Your OTP: <span className="font-mono font-bold text-primary text-sm">{signupGeneratedOtp}</span>
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
