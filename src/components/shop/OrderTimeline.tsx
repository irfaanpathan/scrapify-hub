import { Package, Truck, UserCheck, Scale, CreditCard, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface OrderTimelineProps {
  status: string;
  createdAt: string;
  updatedAt: string;
}

const ORDER_STEPS = [
  { key: "pending", label: "Order Placed", icon: Package },
  { key: "assigned", label: "Partner Assigned", icon: UserCheck },
  { key: "picked", label: "Scrap Picked", icon: Truck },
  { key: "weighed", label: "Scrap Weighed", icon: Scale },
  { key: "paid", label: "Payment Done", icon: CreditCard },
  { key: "completed", label: "Completed", icon: CheckCircle },
];

const OrderTimeline = ({ status, createdAt, updatedAt }: OrderTimelineProps) => {
  const currentStepIndex = ORDER_STEPS.findIndex((step) => step.key === status);

  return (
    <div className="py-4">
      <div className="relative">
        {/* Progress line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
        <div
          className="absolute left-4 top-0 w-0.5 bg-primary transition-all duration-500"
          style={{
            height: `${Math.min(100, ((currentStepIndex + 1) / ORDER_STEPS.length) * 100)}%`,
          }}
        />

        {/* Steps */}
        <div className="space-y-6">
          {ORDER_STEPS.map((step, index) => {
            const isCompleted = index <= currentStepIndex;
            const isCurrent = index === currentStepIndex;
            const Icon = step.icon;

            return (
              <div key={step.key} className="relative flex items-center gap-4 pl-10">
                {/* Step icon */}
                <div
                  className={cn(
                    "absolute left-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300",
                    isCompleted
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground",
                    isCurrent && "ring-4 ring-primary/20 scale-110"
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>

                {/* Step content */}
                <div className="flex-1">
                  <p
                    className={cn(
                      "font-medium text-sm",
                      isCompleted ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {step.label}
                  </p>
                  {isCurrent && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(updatedAt).toLocaleString()}
                    </p>
                  )}
                  {index === 0 && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(createdAt).toLocaleString()}
                    </p>
                  )}
                </div>

                {/* Status badge for current */}
                {isCurrent && (
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                    Current
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default OrderTimeline;
