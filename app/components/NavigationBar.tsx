"use client";

import Link from "next/link";
import { HomeIcon, CogIcon } from "@heroicons/react/24/outline";

export default function NavigationBar() {
  return (
    <nav className="bg-gray-800 text-white p-4">
      <ul className="flex space-x-4">
        <li>
          <Link
            href="/"
            className="flex items-center space-x-2 hover:text-blue-400"
          >
            <HomeIcon className="h-5 w-5" />
            <span>ホーム</span>
          </Link>
        </li>
        <li>
          <Link
            href="/settings"
            className="flex items-center space-x-2 hover:text-blue-400"
          >
            <CogIcon className="h-5 w-5" />
            <span>設定</span>
          </Link>
        </li>
      </ul>
    </nav>
  );
}
