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

export const sampleSavedVisualization = {
  visualization: {
    id: 'oiuccXwBYVazWqOO1e06',
    name: 'Flight Count by Origin',
    query:
      'source=opensearch_dashboards_sample_data_flights | fields Carrier,FlightDelayMin | stats sum(FlightDelayMin) as delays by Carrier',
    type: 'bar',
    timeField: 'timestamp',
  },
};

export const samplePPLResponse = {
  data: {
    'avg(FlightDelayMin)': [
      53.65384615384615,
      45.36144578313253,
      63.1578947368421,
      46.81318681318681,
    ],
    Carrier: ['BeatsWest', 'Logstash Airways', 'OpenSearch Dashboards Airlines', 'OpenSearch-Air'],
  },
  metadata: {
    fields: [
      { name: 'avg(FlightDelayMin)', type: 'double' },
      { name: 'Carrier', type: 'keyword' },
    ],
  },
  size: 4,
  status: 200,
  jsonData: [
    { 'avg(FlightDelayMin)': 53.65384615384615, Carrier: 'BeatsWest' },
    { 'avg(FlightDelayMin)': 45.36144578313253, Carrier: 'Logstash Airways' },
    { 'avg(FlightDelayMin)': 63.1578947368421, Carrier: 'OpenSearch Dashboards Airlines' },
    { 'avg(FlightDelayMin)': 46.81318681318681, Carrier: 'OpenSearch-Air' },
  ],
};

export const samplePPLEmptyResponse = {
  data: { "count('ip')": [], 'span(timestamp,1h)': [] },
  metadata: {
    fields: [
      { name: "count('ip')", type: 'integer' },
      { name: 'span(timestamp,1h)', type: 'timestamp' },
    ],
  },
  size: 0,
  status: 200,
  jsonData: [],
};

export const samplePanelVisualizations = [
  {
    id: 'panel_viz_ed409e13-4759-4e0f-9bc1-6ae32999318e',
    savedVisualizationId: 'SMQu43wBDp0rvEg3jXMF',
    x: 0,
    y: 0,
    w: 6,
    h: 4,
  },
  {
    id: 'panel_viz_f59ad102-943e-48d9-9c0a-3df7055070a3',
    savedVisualizationId: 'ScQu43wBDp0rvEg34XNS',
    x: 0,
    y: 4,
    w: 6,
    h: 4,
  },
];

export const sampleLayout = [
  { i: 'panel_viz_ed409e13-4759-4e0f-9bc1-6ae32999318e', x: 0, y: 0, w: 3, h: 2 },
  { i: 'panel_viz_f59ad102-943e-48d9-9c0a-3df7055070a3', x: 3, y: 0, w: 6, h: 4 },
];

export const sampleMergedVisualizations = [
  {
    id: 'panel_viz_ed409e13-4759-4e0f-9bc1-6ae32999318e',
    savedVisualizationId: 'SMQu43wBDp0rvEg3jXMF',
    x: 0,
    y: 0,
    w: 3,
    h: 2,
  },
  {
    id: 'panel_viz_f59ad102-943e-48d9-9c0a-3df7055070a3',
    savedVisualizationId: 'ScQu43wBDp0rvEg34XNS',
    x: 3,
    y: 0,
    w: 6,
    h: 4,
  },
];
