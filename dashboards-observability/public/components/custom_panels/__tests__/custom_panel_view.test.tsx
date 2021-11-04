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
import React from 'react';
import { CustomPanelView } from '../custom_panel_view';
import { waitFor } from '@testing-library/react';
import {
  sampleEmptyPanel,
  samplePanel,
  samplePPLResponse,
  sampleSavedVisualization,
} from '../../../../test/panels_constants';
import httpClientMock from '../../../../test/__mocks__/httpClientMock';
import PPLService from '../../../../public/services/requests/ppl';
import { coreStartMock } from '../../../../test/__mocks__/coreMocks';
import { HttpResponse } from '../../../../../../src/core/public';

describe('Panels View Component', () => {
  configure({ adapter: new Adapter() });

  it('renders panel view container without visualizations', async () => {
    httpClientMock.get = jest.fn(() =>
      Promise.resolve((sampleEmptyPanel as unknown) as HttpResponse)
    );
    const panelId = 'L8Sx53wBDp0rvEg3yoLb';
    const http = httpClientMock;
    const pplService = new PPLService(httpClientMock);
    const core = coreStartMock;
    const parentBreadcrumb = [
      { text: 'Operational panels', href: '#/operational_panels/' },
      { text: 'Observability', href: 'observability#/' },
    ];
    const renameCustomPanel = jest.fn();
    const cloneCustomPanel = jest.fn();
    const deleteCustomPanel = jest.fn();
    const setToast = jest.fn();

    const wrapper = mount(
      <CustomPanelView
        panelId={panelId}
        http={http}
        pplService={pplService}
        chrome={core.chrome}
        parentBreadcrumb={parentBreadcrumb}
        renameCustomPanel={renameCustomPanel}
        cloneCustomPanel={cloneCustomPanel}
        deleteCustomPanel={deleteCustomPanel}
        setToast={setToast}
      />
    );
    wrapper.update();

    await waitFor(() => {
      expect(wrapper).toMatchSnapshot();
    });
  });

  it('renders panel view container with visualizations', async () => {
    let counter = 0;
    httpClientMock.get = jest.fn(() => {
      if (counter === 0) {
        console.log('get call if', counter);
        counter += 1;
        return Promise.resolve((samplePanel as unknown) as HttpResponse);
      } else {
        console.log('get call else', counter);
        counter += 1;
        return Promise.resolve((sampleSavedVisualization as unknown) as HttpResponse);
      }
    });

    httpClientMock.post = jest.fn(() =>
      Promise.resolve((samplePPLResponse as unknown) as HttpResponse)
    );
    const panelId = 'L8Sx53wBDp0rvEg3yoLb';
    const http = httpClientMock;
    const pplService = new PPLService(httpClientMock);
    const core = coreStartMock;
    const parentBreadcrumb = [
      { text: 'Operational panels', href: '#/operational_panels/' },
      { text: 'Observability', href: 'observability#/' },
    ];
    const renameCustomPanel = jest.fn();
    const cloneCustomPanel = jest.fn();
    const deleteCustomPanel = jest.fn();
    const setToast = jest.fn();

    const wrapper = mount(
      <CustomPanelView
        panelId={panelId}
        http={http}
        pplService={pplService}
        chrome={core.chrome}
        parentBreadcrumb={parentBreadcrumb}
        renameCustomPanel={renameCustomPanel}
        cloneCustomPanel={cloneCustomPanel}
        deleteCustomPanel={deleteCustomPanel}
        setToast={setToast}
      />
    );
    wrapper.update();

    await waitFor(() => {
      expect(wrapper).toMatchSnapshot();
    });
  });
});
