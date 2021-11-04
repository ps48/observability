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

import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import React from 'react';
import { FlyoutContainers } from '../flyout_containers';

describe('Flyout Container component', () => {
  configure({ adapter: new Adapter() });

  it('renders empty flyout Container', () => {
    const closeFlyout = jest.fn();
    const flyoutHeader = <div />;
    const flyoutBody = <div />;
    const flyoutFooter = <div />;
    const ariaLabel = 'sampleFlyout';
    const wrapper = shallow(
      <FlyoutContainers
        closeFlyout={closeFlyout}
        flyoutHeader={flyoutHeader}
        flyoutBody={flyoutBody}
        flyoutFooter={flyoutFooter}
        ariaLabel={ariaLabel}
      />
    );

    expect(wrapper).toMatchSnapshot();
  });
});
