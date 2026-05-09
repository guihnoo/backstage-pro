import { LayoutDashboard, Calendar, Users, Receipt, BarChart2, Bot } from 'lucide-react';

export const defaultNavItems = [
    { href: "/Dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/Calendar", icon: Calendar, label: "Agenda" },
    { href: "/Clients", icon: Users, label: "Clientes" },
    { href: "/Expenses", icon: Receipt, label: "Despesas" },
    { href: "/reports", icon: BarChart2, label: "Relatórios" },
    { href: "/AI_Mentor", icon: Bot, label: "AI Mentor" },
];