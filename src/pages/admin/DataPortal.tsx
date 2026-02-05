import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, Users, Package, Star, CreditCard, MapPin, Truck, Search, Database } from "lucide-react";
import { format } from "date-fns";

interface Profile {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  role: string;
  created_at: string;
}

interface Order {
  id: string;
  customer_id: string;
  category: string;
  sub_category: string | null;
  status: string;
  pickup_address: string;
  pickup_time: string;
  estimated_weight: number | null;
  actual_weight: number | null;
  total_amount: number | null;
  created_at: string;
}

interface Review {
  id: string;
  order_id: string;
  customer_id: string;
  partner_id: string | null;
  rating: number;
  comment: string | null;
  created_at: string;
}

interface Payment {
  id: string;
  order_id: string;
  customer_id: string;
  amount: number;
  payment_method: string;
  payment_status: string;
  transaction_id: string | null;
  created_at: string;
}

interface SavedAddress {
  id: string;
  user_id: string;
  label: string;
  address_line1: string;
  city: string;
  state: string;
  pincode: string;
  is_default: boolean | null;
}

interface PartnerDetail {
  id: string;
  user_id: string;
  vehicle_type: string | null;
  vehicle_number: string | null;
  average_rating: number | null;
  total_pickups: number | null;
  is_available: boolean | null;
  service_areas: string[] | null;
}

const DataPortal = () => {
  const { isAdmin, loading } = useAdminAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [partners, setPartners] = useState<PartnerDetail[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("customers");

  useEffect(() => {
    if (!isAdmin) return;

    const fetchAllData = async () => {
      setDataLoading(true);
      try {
        const [
          profilesRes,
          ordersRes,
          reviewsRes,
          paymentsRes,
          addressesRes,
          partnersRes,
        ] = await Promise.all([
          supabase.from("profiles").select("*").order("created_at", { ascending: false }),
          supabase.from("orders").select("*").order("created_at", { ascending: false }),
          supabase.from("reviews").select("*").order("created_at", { ascending: false }),
          supabase.from("payments").select("*").order("created_at", { ascending: false }),
          supabase.from("saved_addresses").select("*").order("created_at", { ascending: false }),
          supabase.from("partner_details").select("*").order("created_at", { ascending: false }),
        ]);

        if (profilesRes.data) setProfiles(profilesRes.data);
        if (ordersRes.data) setOrders(ordersRes.data);
        if (reviewsRes.data) setReviews(reviewsRes.data);
        if (paymentsRes.data) setPayments(paymentsRes.data);
        if (addressesRes.data) setAddresses(addressesRes.data);
        if (partnersRes.data) setPartners(partnersRes.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setDataLoading(false);
      }
    };

    fetchAllData();
  }, [isAdmin]);

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      assigned: "bg-blue-100 text-blue-800",
      picked: "bg-purple-100 text-purple-800",
      weighed: "bg-orange-100 text-orange-800",
      paid: "bg-green-100 text-green-800",
      completed: "bg-emerald-100 text-emerald-800",
    };
    return <Badge className={colors[status] || "bg-gray-100 text-gray-800"}>{status}</Badge>;
  };

  const filterData = <T extends object>(data: T[], term: string): T[] => {
    if (!term) return data;
    return data.filter((item) =>
      Object.values(item).some((val) =>
        String(val).toLowerCase().includes(term.toLowerCase())
      )
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Verifying admin access...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Redirecting to admin login...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar role="admin" />
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Database className="h-8 w-8 text-primary" />
          <h1 className="text-2xl md:text-3xl font-bold">Data Portal</h1>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
          <Card className="shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <Users className="h-6 w-6 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Customers</p>
                <p className="text-xl font-bold">{profiles.filter(p => p.role === 'customer').length}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <Truck className="h-6 w-6 text-accent" />
              <div>
                <p className="text-xs text-muted-foreground">Partners</p>
                <p className="text-xl font-bold">{partners.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <Package className="h-6 w-6 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Orders</p>
                <p className="text-xl font-bold">{orders.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <Star className="h-6 w-6 text-yellow-500" />
              <div>
                <p className="text-xs text-muted-foreground">Reviews</p>
                <p className="text-xl font-bold">{reviews.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <CreditCard className="h-6 w-6 text-green-600" />
              <div>
                <p className="text-xs text-muted-foreground">Payments</p>
                <p className="text-xl font-bold">{payments.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <MapPin className="h-6 w-6 text-red-500" />
              <div>
                <p className="text-xs text-muted-foreground">Addresses</p>
                <p className="text-xl font-bold">{addresses.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search across all data..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {dataLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-2">Loading data...</p>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3 md:grid-cols-6 mb-4">
              <TabsTrigger value="customers" className="gap-1">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Customers</span>
              </TabsTrigger>
              <TabsTrigger value="orders" className="gap-1">
                <Package className="h-4 w-4" />
                <span className="hidden sm:inline">Orders</span>
              </TabsTrigger>
              <TabsTrigger value="reviews" className="gap-1">
                <Star className="h-4 w-4" />
                <span className="hidden sm:inline">Reviews</span>
              </TabsTrigger>
              <TabsTrigger value="payments" className="gap-1">
                <CreditCard className="h-4 w-4" />
                <span className="hidden sm:inline">Payments</span>
              </TabsTrigger>
              <TabsTrigger value="addresses" className="gap-1">
                <MapPin className="h-4 w-4" />
                <span className="hidden sm:inline">Addresses</span>
              </TabsTrigger>
              <TabsTrigger value="partners" className="gap-1">
                <Truck className="h-4 w-4" />
                <span className="hidden sm:inline">Partners</span>
              </TabsTrigger>
            </TabsList>

            {/* Customers Tab */}
            <TabsContent value="customers">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Customer Profiles ({filterData(profiles, searchTerm).length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Address</TableHead>
                        <TableHead>Joined</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filterData(profiles, searchTerm).map((profile) => (
                        <TableRow key={profile.id}>
                          <TableCell className="font-medium">{profile.full_name}</TableCell>
                          <TableCell>{profile.email || "-"}</TableCell>
                          <TableCell>{profile.phone || "-"}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{profile.role}</Badge>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">{profile.address || "-"}</TableCell>
                          <TableCell>{format(new Date(profile.created_at), "dd MMM yyyy")}</TableCell>
                        </TableRow>
                      ))}
                      {filterData(profiles, searchTerm).length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground">
                            No customers found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Orders Tab */}
            <TabsContent value="orders">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    All Orders ({filterData(orders, searchTerm).length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Sub Category</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Pickup Address</TableHead>
                        <TableHead>Weight (Est/Act)</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filterData(orders, searchTerm).map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-mono text-xs">{order.id.slice(0, 8)}...</TableCell>
                          <TableCell className="capitalize">{order.category}</TableCell>
                          <TableCell>{order.sub_category || "-"}</TableCell>
                          <TableCell>{getStatusBadge(order.status)}</TableCell>
                          <TableCell className="max-w-[150px] truncate">{order.pickup_address}</TableCell>
                          <TableCell>
                            {order.estimated_weight || "-"} / {order.actual_weight || "-"} kg
                          </TableCell>
                          <TableCell>₹{order.total_amount?.toFixed(2) || "-"}</TableCell>
                          <TableCell>{format(new Date(order.created_at), "dd MMM yyyy")}</TableCell>
                        </TableRow>
                      ))}
                      {filterData(orders, searchTerm).length === 0 && (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center text-muted-foreground">
                            No orders found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Reviews Tab */}
            <TabsContent value="reviews">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5" />
                    Customer Reviews ({filterData(reviews, searchTerm).length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Review ID</TableHead>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Rating</TableHead>
                        <TableHead>Comment</TableHead>
                        <TableHead>Customer ID</TableHead>
                        <TableHead>Partner ID</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filterData(reviews, searchTerm).map((review) => (
                        <TableRow key={review.id}>
                          <TableCell className="font-mono text-xs">{review.id.slice(0, 8)}...</TableCell>
                          <TableCell className="font-mono text-xs">{review.order_id.slice(0, 8)}...</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {"★".repeat(review.rating)}
                              {"☆".repeat(5 - review.rating)}
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">{review.comment || "-"}</TableCell>
                          <TableCell className="font-mono text-xs">{review.customer_id.slice(0, 8)}...</TableCell>
                          <TableCell className="font-mono text-xs">{review.partner_id?.slice(0, 8) || "-"}...</TableCell>
                          <TableCell>{format(new Date(review.created_at), "dd MMM yyyy")}</TableCell>
                        </TableRow>
                      ))}
                      {filterData(reviews, searchTerm).length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground">
                            No reviews found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Payments Tab */}
            <TabsContent value="payments">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Payment History ({filterData(payments, searchTerm).length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Payment ID</TableHead>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Transaction ID</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filterData(payments, searchTerm).map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell className="font-mono text-xs">{payment.id.slice(0, 8)}...</TableCell>
                          <TableCell className="font-mono text-xs">{payment.order_id.slice(0, 8)}...</TableCell>
                          <TableCell className="font-semibold">₹{payment.amount.toFixed(2)}</TableCell>
                          <TableCell className="capitalize">{payment.payment_method}</TableCell>
                          <TableCell>
                            <Badge
                              className={
                                payment.payment_status === "completed"
                                  ? "bg-green-100 text-green-800"
                                  : payment.payment_status === "pending"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                              }
                            >
                              {payment.payment_status}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-xs">{payment.transaction_id || "-"}</TableCell>
                          <TableCell>{format(new Date(payment.created_at), "dd MMM yyyy")}</TableCell>
                        </TableRow>
                      ))}
                      {filterData(payments, searchTerm).length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground">
                            No payments found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Addresses Tab */}
            <TabsContent value="addresses">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Saved Addresses ({filterData(addresses, searchTerm).length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User ID</TableHead>
                        <TableHead>Label</TableHead>
                        <TableHead>Address</TableHead>
                        <TableHead>City</TableHead>
                        <TableHead>State</TableHead>
                        <TableHead>Pincode</TableHead>
                        <TableHead>Default</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filterData(addresses, searchTerm).map((address) => (
                        <TableRow key={address.id}>
                          <TableCell className="font-mono text-xs">{address.user_id.slice(0, 8)}...</TableCell>
                          <TableCell>
                            <Badge variant="outline">{address.label}</Badge>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">{address.address_line1}</TableCell>
                          <TableCell>{address.city}</TableCell>
                          <TableCell>{address.state}</TableCell>
                          <TableCell>{address.pincode}</TableCell>
                          <TableCell>
                            {address.is_default ? (
                              <Badge className="bg-green-100 text-green-800">Yes</Badge>
                            ) : (
                              <span className="text-muted-foreground">No</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                      {filterData(addresses, searchTerm).length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground">
                            No addresses found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Partners Tab */}
            <TabsContent value="partners">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Partner Details ({filterData(partners, searchTerm).length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Partner ID</TableHead>
                        <TableHead>Vehicle Type</TableHead>
                        <TableHead>Vehicle Number</TableHead>
                        <TableHead>Rating</TableHead>
                        <TableHead>Total Pickups</TableHead>
                        <TableHead>Available</TableHead>
                        <TableHead>Service Areas</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filterData(partners, searchTerm).map((partner) => (
                        <TableRow key={partner.id}>
                          <TableCell className="font-mono text-xs">{partner.user_id.slice(0, 8)}...</TableCell>
                          <TableCell className="capitalize">{partner.vehicle_type || "-"}</TableCell>
                          <TableCell>{partner.vehicle_number || "-"}</TableCell>
                          <TableCell>
                            {partner.average_rating ? (
                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                {Number(partner.average_rating).toFixed(1)}
                              </div>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell>{partner.total_pickups || 0}</TableCell>
                          <TableCell>
                            {partner.is_available ? (
                              <Badge className="bg-green-100 text-green-800">Available</Badge>
                            ) : (
                              <Badge className="bg-red-100 text-red-800">Unavailable</Badge>
                            )}
                          </TableCell>
                          <TableCell className="max-w-[150px] truncate">
                            {partner.service_areas?.join(", ") || "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                      {filterData(partners, searchTerm).length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground">
                            No partner details found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default DataPortal;
