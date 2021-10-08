/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import { schema } from '@osd/config-schema';
import { CustomPanelsAdaptor } from '../../adaptors/custom_panels/custom_panel_adaptor';
import {
  IRouter,
  IOpenSearchDashboardsResponse,
  ResponseError,
  IScopedClusterClient,
  ILegacyScopedClusterClient,
} from '../../../../../src/core/server';
import { CUSTOM_PANELS_API_PREFIX as API_PREFIX } from '../../../common/constants/custom_panels';

export function VisualizationsRouter(router: IRouter) {
  // NOTE: Currently the API calls are dummy and are not connected to esclient.
  // Fetch all the savedVisualzations
  const customPanelBackend = new CustomPanelsAdaptor();
  router.get(
    {
      path: `${API_PREFIX}/visualizations`,
      validate: {},
    },
    async (
      context,
      request,
      response
    ): Promise<IOpenSearchDashboardsResponse<any | ResponseError>> => {
      const opensearchNotebooksClient: ILegacyScopedClusterClient = context.observability_plugin.observabilityClient.asScoped(
        request
      );

      // const savedVisualizations = [
      //   {
      //     id: '1',
      //     title: 'Demo Viz 1',
      //     query:
      //       "source=opensearch_dashboards_sample_data_flights | fields Carrier,Origin | where Carrier='OpenSearch-Air' | stats count() by Origin",
      //     type: 'line',
      //   },
      //   {
      //     id: '2',
      //     title: 'Demo Viz 2',
      //     query:
      //       'source=opensearch_dashboards_sample_data_flights | fields Carrier,Origin | where Carrier=&#39;OpenSearch-Air&#39; | stats count() by Origin',
      //     type: 'bar',
      //   },
      //   {
      //     id: '3',
      //     title: 'Demo Viz 3',
      //     query:
      //       'source=opensearch_dashboards_sample_data_flights | fields Carrier,FlightDelayMin | stats sum(FlightDelayMin) as delays by Carrier',
      //     type: 'bar',
      //   },
      // ];

      const savedObjects = [
        {
          id: 'w2eq211124321432432e2',
          query:
            "search source=opensearch_dashboards_sample_data_logs | where utc_time > timestamp('2021-07-01 00:00:00') and utc_time < timestamp('2021-07-02 00:00:00') | stats count() by span(timestamp, '1h')",
          selected_date_range: {
            start: 'now/15m',
            end: 'now',
            text:
              "utc_time > timestamp('2021-07-01 00:00:00') and utc_time < timestamp('2021-07-02 00:00:00')",
          },
          selected_fields: {
            text: '',
            tokens: [],
          },
          type: 'bar',
          name: 'Total counts by timespan',
          time_field: 'utc_time',
          description: 'some descriptions related to this query',
        },
        {
          id: 'w2eq2111243214324343',
          query:
            "source=opensearch_dashboards_sample_data_flights | fields Carrier,Origin | where Carrier='OpenSearch-Air' | stats count() by Origin",
          selected_date_range: {
            start: 'now/15m',
            end: 'now',
            text:
              'timestamp &gt; timestamp(&#39;2020-07-01 00:00:00&#39;) and timestamp &lt; timestamp(&#39;2021-09-02 00:00:00&#39;)',
          },
          selected_fields: {
            text: '',
            tokens: [],
          },
          type: 'bar',
          name: 'Demo Viz 1',
          time_field: 'timestamp',
          description: 'some descriptions related to this query',
        },
        {
          id: 'w2eq2111243214324awdw43',
          query:
            "source=opensearch_dashboards_sample_data_flights | where timestamp > timestamp('2020-07-01 00:00:00') and timestamp < timestamp('2021-09-02 00:00:00') | fields Carrier,FlightDelayMin | stats sum(FlightDelayMin) as delays by Carrier",
          selected_date_range: {
            start: 'now/15m',
            end: 'now',
            text:
              'timestamp &gt; timestamp(&#39;2020-07-01 00:00:00&#39;) and timestamp &lt; timestamp(&#39;2021-09-02 00:00:00&#39;)',
          },
          selected_fields: {
            text: '',
            tokens: [],
          },
          type: 'line',
          name: 'Demo Viz 2',
          time_field: 'timestamp',
          description: 'some descriptions related to this query',
        },
      ];
      try {
        // const savedVisualizations = customPanelBackend.viewSavedVisualiationList(opensearchNotebooksClient);
        return response.ok({
          body: {
            visualizations: savedObjects,
          },
        });
      } catch (error) {
        console.log('Issue in fetching saved visualizations:', error);
        return response.custom({
          statusCode: error.statusCode || 500,
          body: error.message,
        });
      }
    }
  );

  // Add a new visualization to the panel
  router.post(
    {
      path: `${API_PREFIX}/visualizations`,
      validate: {
        body: schema.object({
          panelId: schema.string(),
          newVisualization: schema.object({
            id: schema.string(),
            title: schema.string(),
            query: schema.string(),
            type: schema.string(),
            timeField: schema.string(),
          }),
        }),
      },
    },
    async (
      context,
      request,
      response
    ): Promise<IOpenSearchDashboardsResponse<any | ResponseError>> => {
      const opensearchNotebooksClient: ILegacyScopedClusterClient = context.observability_plugin.observabilityClient.asScoped(
        request
      );

      try {
        const newVisualizations = await customPanelBackend.addVisualization(
          opensearchNotebooksClient,
          request.body.panelId,
          request.body.newVisualization
        );
        return response.ok({
          body: {
            message: 'Visualization Added',
            visualizations: newVisualizations,
          },
        });
      } catch (error) {
        console.log('Issue in adding visualization:', error);
        return response.custom({
          statusCode: error.statusCode || 500,
          body: error.message,
        });
      }
    }
  );

  // Replace an existing visualization
  router.post(
    {
      path: `${API_PREFIX}/visualizations/replace`,
      validate: {
        body: schema.object({
          panelId: schema.string(),
          oldVisualizationId: schema.string(),
          newVisualization: schema.object({
            id: schema.string(),
            title: schema.string(),
            query: schema.string(),
            type: schema.string(),
            timeField: schema.string(),
          }),
        }),
      },
    },
    async (
      context,
      request,
      response
    ): Promise<IOpenSearchDashboardsResponse<any | ResponseError>> => {
      const opensearchNotebooksClient: ILegacyScopedClusterClient = context.observability_plugin.observabilityClient.asScoped(
        request
      );

      try {
        const newVisualizations = await customPanelBackend.addVisualization(
          opensearchNotebooksClient,
          request.body.panelId,
          request.body.newVisualization,
          request.body.oldVisualizationId
        );
        return response.ok({
          body: {
            message: 'Visualization Replaced',
            visualizations: newVisualizations,
          },
        });
      } catch (error) {
        console.log('Issue in replacing visualization:', error);
        return response.custom({
          statusCode: error.statusCode || 500,
          body: error.message,
        });
      }
    }
  );

  // Delete an existing visualization
  router.delete(
    {
      path: `${API_PREFIX}/visualizations/{panelId}/{visualizationId}`,
      validate: {
        params: schema.object({
          panelId: schema.string(),
          visualizationId: schema.string(),
        }),
      },
    },
    async (
      context,
      request,
      response
    ): Promise<IOpenSearchDashboardsResponse<any | ResponseError>> => {
      const opensearchNotebooksClient: ILegacyScopedClusterClient = context.observability_plugin.observabilityClient.asScoped(
        request
      );

      try {
        const newVisualizations = await customPanelBackend.deleteVisualization(
          opensearchNotebooksClient,
          request.params.panelId,
          request.params.visualizationId
        );
        return response.ok({
          body: {
            message: 'Visualization Deleted',
            visualizations: newVisualizations,
          },
        });
      } catch (error) {
        console.log('Issue in deleting visualization:', error);
        return response.custom({
          statusCode: error.statusCode || 500,
          body: error.message,
        });
      }
    }
  );

  // changes the position of the mentioned visualizations
  // Also removes the visualiations not mentioned
  router.put(
    {
      path: `${API_PREFIX}/visualizations/edit`,
      validate: {
        body: schema.object({
          panelId: schema.string(),
          visualizationParams: schema.arrayOf(
            schema.object({
              i: schema.string(),
              x: schema.number(),
              y: schema.number(),
              w: schema.number(),
              h: schema.number(),
            })
          ),
        }),
      },
    },
    async (
      context,
      request,
      response
    ): Promise<IOpenSearchDashboardsResponse<any | ResponseError>> => {
      const opensearchNotebooksClient: ILegacyScopedClusterClient = context.observability_plugin.observabilityClient.asScoped(
        request
      );

      try {
        const newVisualizations = await customPanelBackend.editVisualization(
          opensearchNotebooksClient,
          request.body.panelId,
          request.body.visualizationParams
        );
        return response.ok({
          body: {
            message: 'Visualizations Edited',
            visualizations: newVisualizations,
          },
        });
      } catch (error) {
        console.log('Issue in Editing visualizations:', error);
        return response.custom({
          statusCode: error.statusCode || 500,
          body: error.message,
        });
      }
    }
  );
}
