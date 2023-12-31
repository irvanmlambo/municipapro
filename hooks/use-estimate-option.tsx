import { useRouter } from "next/router";

import useSWR from "swr";

// services
import estimatesService from "../services/estimates.service";
// hooks
import useProjectDetails from "../hooks/use-project-details";
// helpers
import { orderArrayBy } from "../helpers/array.helper";
// fetch-keys
import { ESTIMATE_DETAILS } from "../constants/fetch-keys";

const useEstimateOption = (estimateKey?: number | null) => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { projectDetails } = useProjectDetails();

  const { data: estimateDetails, error: estimateDetailsError } = useSWR(
    workspaceSlug && projectId && projectDetails && projectDetails?.estimate
      ? ESTIMATE_DETAILS(projectDetails.estimate as string)
      : null,
    workspaceSlug && projectId && projectDetails && projectDetails.estimate
      ? () =>
          estimatesService.getEstimateDetails(
            workspaceSlug.toString(),
            projectId.toString(),
            projectDetails.estimate as string
          )
      : null
  );

  const estimateValue: any =
    (estimateKey && estimateDetails?.points?.find((e) => e.key === estimateKey)?.value) ?? "None";

  return {
    isEstimateActive: projectDetails?.estimate ? true : false,
    estimatePoints: orderArrayBy(estimateDetails?.points ?? [], "key"),
    estimateValue,
  };
};

export default useEstimateOption;
