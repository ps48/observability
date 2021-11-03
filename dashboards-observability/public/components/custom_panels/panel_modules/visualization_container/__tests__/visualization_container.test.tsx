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

import { configure, mount } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import PPLService from '../../../../../services/requests/ppl';
import React from 'react';
import { VisualizationContainer } from '../visualization_container';
import httpClientMock from '../../../../../../test/__mocks__/httpClientMock';
import { HttpResponse } from '../../../../../../../../src/core/public';
import { waitFor } from '@testing-library/react';

describe('Visualization Container Component', () => {
  configure({ adapter: new Adapter() });

  it('renders add visualization container', async () => {
    httpClientMock.get = jest.fn(() =>
      Promise.resolve(({
        visualization: {
          id: 'oiuccXwBYVazWqOO1e06',
          name: 'Flight Count by Origin',
          query:
            'source=opensearch_dashboards_sample_data_flights | fields Carrier,FlightDelayMin | stats sum(FlightDelayMin) as delays by Carrier',
          type: 'bar',
          timeField: 'timestamp',
        },
      } as unknown) as HttpResponse)
    );

    httpClientMock.post = jest.fn(() =>
      Promise.resolve(({
        data: {
          'avg(FlightDelayMin)': [
            53.65384615384615,
            45.36144578313253,
            63.1578947368421,
            46.81318681318681,
          ],
          Carrier: [
            'BeatsWest',
            'Logstash Airways',
            'OpenSearch Dashboards Airlines',
            'OpenSearch-Air',
          ],
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
      } as unknown) as HttpResponse)
    );

    const editMode = true;
    const visualizationId = 'panel_viz_9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d';
    const savedVisualizationId = 'oiuccXwBYVazWqOO1e06';
    const fromTime = 'now-15m';
    const toTime = 'now';
    const onRefresh = true;
    const cloneVisualization = jest.fn();
    const pplFilterValue = 'where Carrier = "OpenSearch-Air"';
    const showFlyout = jest.fn();
    const removeVisualization = jest.fn();
    const pplService = new PPLService(httpClientMock);

    const wrapper = mount(
      <VisualizationContainer
        http={httpClientMock}
        editMode={editMode}
        visualizationId={visualizationId}
        savedVisualizationId={savedVisualizationId}
        pplService={pplService}
        fromTime={fromTime}
        toTime={toTime}
        onRefresh={onRefresh}
        cloneVisualization={cloneVisualization}
        pplFilterValue={pplFilterValue}
        showFlyout={showFlyout}
        removeVisualization={removeVisualization} />
    );
    wrapper.update();

    await waitFor(() => {
      expect(wrapper).toMatchSnapshot();
    });
  });
});
