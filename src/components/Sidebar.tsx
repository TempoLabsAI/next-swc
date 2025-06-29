"use client";

import { cn } from "@/lib/utils";
import {
  BarChart3,
  ChevronLeft,
  Home,
  Settings,
  Users,
  FileText,
  Mail,
  Calendar,
  Folder,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface SidebarProps {
  open: boolean;
  collapsed: boolean;
  onClose: () => void;
  onToggleCollapse: () => void;
}

const navigation = [
  { name: "Dashboard", href: "/", icon: Home, current: true },
  { name: "Analytics", href: "/analytics", icon: BarChart3, current: false },
  { name: "Users", href: "/users", icon: Users, current: false },
  { name: "Documents", href: "/documents", icon: FileText, current: false },
  { name: "Messages", href: "/messages", icon: Mail, current: false },
  { name: "Calendar", href: "/calendar", icon: Calendar, current: false },
  { name: "Projects", href: "/projects", icon: Folder, current: false },
];

const secondaryNavigation = [
  { name: "Settings", href: "/settings", icon: Settings },
  { name: "Help", href: "/help", icon: HelpCircle },
];

export function Sidebar({
  open,
  collapsed,
  onClose,
  onToggleCollapse,
}: SidebarProps) {
  return (
    <>
      {/* Mobile sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform bg-white dark:bg-gray-800 transition-transform duration-300 ease-in-out lg:hidden",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-full flex-col">
          <SidebarContent
            collapsed={false}
            onToggleCollapse={onToggleCollapse}
          />
        </div>
      </div>

      {/* Desktop sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden transform bg-white dark:bg-gray-800 transition-all duration-300 ease-in-out lg:block",
          collapsed ? "w-16" : "w-64",
        )}
      >
        <div className="flex h-full flex-col">
          <SidebarContent
            collapsed={collapsed}
            onToggleCollapse={onToggleCollapse}
          />
        </div>
      </div>
    </>
  );
}

function SidebarContent({
  collapsed,
  onToggleCollapse,
}: {
  collapsed: boolean;
  onToggleCollapse: () => void;
}) {
  return (
    <>
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700">
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              Admin
            </span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleCollapse}
          className="hidden lg:flex h-8 w-8"
        >
          <ChevronLeft
            className={cn(
              "h-4 w-4 transition-transform duration-200",
              collapsed && "rotate-180",
            )}
          />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-2 py-4">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <a
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center rounded-md px-2 py-2 text-sm font-medium transition-colors duration-150",
                item.current
                  ? "bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white",
              )}
              title={collapsed ? item.name : undefined}
            >
              <Icon
                className={cn(
                  "h-5 w-5 flex-shrink-0",
                  item.current
                    ? "text-blue-500 dark:text-blue-400"
                    : "text-gray-400 group-hover:text-gray-500 dark:text-gray-400 dark:group-hover:text-gray-300",
                  collapsed ? "mr-0" : "mr-3",
                )}
              />
              {!collapsed && item.name}
            </a>
          );
        })}
      </nav>

      {/* Secondary navigation */}
      <div className="px-2 pb-4">
        <Separator className="mb-4" />
        <div className="space-y-1">
          {secondaryNavigation.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.name}
                href={item.href}
                className={cn(
                  "group flex items-center rounded-md px-2 py-2 text-sm font-medium text-gray-600 transition-colors duration-150 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white",
                )}
                title={collapsed ? item.name : undefined}
              >
                <Icon
                  className={cn(
                    "h-5 w-5 flex-shrink-0 text-gray-400 group-hover:text-gray-500 dark:text-gray-400 dark:group-hover:text-gray-300",
                    collapsed ? "mr-0" : "mr-3",
                  )}
                />
                {!collapsed && item.name}
              </a>
            );
          })}
        </div>
      </div>
    </>
  );
}
