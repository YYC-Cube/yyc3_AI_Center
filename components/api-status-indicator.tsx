import { Badge } from "@/components/ui/badge";

interface APIStatusIndicatorProps {
  service: string;
  enabled: boolean;
  status: "online" | "offline" | "demo";
}

export function APIStatusIndicator({
  service,
  enabled,
  status,
}: APIStatusIndicatorProps) {
  const getStatusColor = () => {
    switch (status) {
      case "online":
        return "bg-green-500/20 text-green-300 border-green-500/30";
      case "offline":
        return "bg-red-500/20 text-red-300 border-red-500/30";
      case "demo":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";
      default:
        return "bg-gray-500/20 text-gray-300 border-gray-500/30";
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case "online":
        return "🟢";
      case "offline":
        return "🔴";
      case "demo":
        return "🟡";
      default:
        return "⚪";
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "online":
        return "在线";
      case "offline":
        return "离线";
      case "demo":
        return "演示";
      default:
        return "未知";
    }
  };

  return (
    <Badge className={`${getStatusColor()} text-xs`}>
      {getStatusIcon()} {service} - {getStatusText()}
    </Badge>
  );
}
