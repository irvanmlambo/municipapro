import React, { useEffect, useState } from "react";

import { useRouter } from "next/router";
import Image from "next/image";
import Link from "next/link";

import useSWR, { mutate } from "swr";

// next-themes
import { useTheme } from "next-themes";
// layouts
import { WorkspaceAuthorizationLayout } from "../../layouts/auth-layout";
// services
import userService from "../../services/user.service";
// hooks
import useUser from "../../hooks/use-user";
import useProjects from "../../hooks/use-projects";
// components
import {
  CompletedIssuesGraph,
  IssuesList,
  IssuesPieChart,
  IssuesStats,
} from "../../components/workspace";
import { TourRoot } from "../../components/onboarding";
// ui
import { PrimaryButton, ProductUpdatesModal } from "../../components/ui";
// icons
import { BoltOutlined, GridViewOutlined } from "@mui/icons-material";
// images
import emptyDashboard from "public/empty-state/dashboard.svg";
import githubBlackImage from "/public/logos/github-black.png";
import githubWhiteImage from "/public/logos/github-white.png";
// helpers
import { render12HourFormatTime, renderShortDate } from "../../helpers/date-time.helper";
// types
import { ICurrentUserResponse } from "../../types";
import type { NextPage } from "next";
// fetch-keys
import { CURRENT_USER, USER_WORKSPACE_DASHBOARD } from "../../constants/fetch-keys";
// constants
import { DAYS } from "../../constants/project";

const WorkspacePage: NextPage = () => {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [isProductUpdatesModalOpen, setIsProductUpdatesModalOpen] = useState(false);

  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { theme } = useTheme();

  const { user } = useUser();
  const { projects } = useProjects();

  const { data: workspaceDashboardData } = useSWR(
    workspaceSlug ? USER_WORKSPACE_DASHBOARD(workspaceSlug as string) : null,
    workspaceSlug ? () => userService.userWorkspaceDashboard(workspaceSlug as string, month) : null
  );

  const today = new Date();
  const greeting =
    today.getHours() < 12 ? "morning" : today.getHours() < 18 ? "afternoon" : "evening";

  useEffect(() => {
    if (!workspaceSlug) return;

    mutate(USER_WORKSPACE_DASHBOARD(workspaceSlug as string));
  }, [month, workspaceSlug]);

  return (
    <WorkspaceAuthorizationLayout
      left={
        <div className="flex items-center gap-2 pl-3">
          <GridViewOutlined fontSize="small" />
          Dashboard
        </div>
      }
    >
      {isProductUpdatesModalOpen && (
        <ProductUpdatesModal
          isOpen={isProductUpdatesModalOpen}
          setIsOpen={setIsProductUpdatesModalOpen}
        />
      )}
      {user && !user.is_tour_completed && (
        <div className="fixed top-0 left-0 h-full w-full bg-custom-backdrop bg-opacity-50 transition-opacity z-20 grid place-items-center">
          <TourRoot
            onComplete={() => {
              mutate<ICurrentUserResponse>(
                CURRENT_USER,
                (prevData: any) => {
                  if (!prevData) return prevData;

                  return {
                    ...prevData,
                    is_tour_completed: true,
                  };
                },
                false
              );

              userService.updateUserTourCompleted(user).catch(() => mutate(CURRENT_USER));
            }}
          />
        </div>
      )}
      {projects ? (
        projects.length > 0 ? (
          <div className="p-8">
            <div className="flex flex-col gap-8">
              <IssuesStats data={workspaceDashboardData} />
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                <IssuesList issues={workspaceDashboardData?.overdue_issues} type="overdue" />
                <IssuesList issues={workspaceDashboardData?.upcoming_issues} type="upcoming" />
                <IssuesPieChart groupedIssues={workspaceDashboardData?.state_distribution} />
                <CompletedIssuesGraph
                  issues={workspaceDashboardData?.completed_issues}
                  month={month}
                  setMonth={setMonth}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8">
            <h3 className="text-2xl font-semibold">
              Good {greeting}, {user?.first_name} {user?.last_name}
            </h3>
            <h6 className="text-custom-text-400 font-medium">
              {greeting === "morning" ? "🌤️" : greeting === "afternoon" ? "🌥️" : "🌙️"}
              {DAYS[today.getDay()]}, {renderShortDate(today)} {render12HourFormatTime(today)}
            </h6>
            <div className="mt-7 bg-custom-primary-100/5 flex justify-between gap-5 md:gap-8">
              <div className="p-5 md:p-8 pr-0">
                <h5 className="text-xl font-semibold">Create a project</h5>
                <p className="mt-2 mb-5">
                  Manage your projects by creating resolutions, cycles, modules, views and pages.
                </p>
                <PrimaryButton
                  onClick={() => {
                    const e = new KeyboardEvent("keydown", {
                      key: "p",
                    });
                    document.dispatchEvent(e);
                  }}
                >
                  Create Project
                </PrimaryButton>
              </div>
            </div>
          </div>
        )
      ) : null}
    </WorkspaceAuthorizationLayout>
  );
};

export default WorkspacePage;
