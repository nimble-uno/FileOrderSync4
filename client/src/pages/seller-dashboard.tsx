import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { DownloadIcon, SearchIcon, TrashIcon } from "lucide-react";
import { Order } from "@shared/schema";

export default function SellerDashboard() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [search, setSearch] = useState("");

  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/orders/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({ title: "Order deleted successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredOrders = orders.filter(order => 
    order.id.toLowerCase().includes(search.toLowerCase())
  );

  const downloadFile = (file: { name: string, url: string }) => {
    const link = document.createElement('a');
    link.href = file.url;
    link.download = file.name; 
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-primary">
            Welcome, {user?.username}
          </h1>
          <Button variant="outline" onClick={() => logoutMutation.mutate()}>
            Logout
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Search Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Input
                placeholder="Search by Order ID"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-sm"
              />
              <Button variant="secondary">
                <SearchIcon className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredOrders.map((order) => (
            <Card key={order.id}>
              <CardHeader>
                <CardTitle>Order {order.id}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Status: {order.hasUploaded ? "Uploaded" : "Pending"}
                  </p>
                  {order.hasUploaded && (
                    <>
                      <p className="text-sm text-muted-foreground">
                        Song Request: {order.songRequest}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Files: {order.files?.videos.length || 0} videos,{" "}
                        {order.files?.images.length || 0} images
                      </p>
                      <div className="flex flex-col gap-2">
                        {order.files?.videos.length > 0 && (
                          <div>
                            <p className="text-sm font-medium mb-1">Videos:</p>
                            <div className="flex flex-wrap gap-2">
                              {order.files.videos.map((video, idx) => (
                                <Button
                                  key={idx}
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => downloadFile(video)}
                                >
                                  <DownloadIcon className="h-4 w-4 mr-2" />
                                  Video {idx + 1}
                                </Button>
                              ))}
                            </div>
                          </div>
                        )}
                        {order.files?.images.length > 0 && (
                          <div>
                            <p className="text-sm font-medium mb-1">Images:</p>
                            <div className="flex flex-wrap gap-2">
                              {order.files.images.map((image, idx) => (
                                <Button
                                  key={idx}
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => downloadFile(image)}
                                >
                                  <DownloadIcon className="h-4 w-4 mr-2" />
                                  Image {idx + 1}
                                </Button>
                              ))}
                            </div>
                          </div>
                        )}
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteMutation.mutate(order.id)}
                          className="mt-2"
                        >
                          <TrashIcon className="h-4 w-4 mr-2" />
                          Delete Order
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}