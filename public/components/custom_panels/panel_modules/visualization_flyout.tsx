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

import {
  EuiButton,
  EuiButtonEmpty,
  EuiButtonIcon,
  EuiCallOut,
  EuiDatePicker,
  EuiDatePickerRange,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFlyoutBody,
  EuiFlyoutFooter,
  EuiFlyoutHeader,
  EuiFormRow,
  EuiIcon,
  EuiSelect,
  EuiSelectOption,
  EuiSpacer,
  EuiText,
  EuiTitle,
  htmlIdGenerator,
  ShortDate,
} from '@elastic/eui';
import { PPL_DATE_FORMAT, UI_DATE_FORMAT } from '../../../../common/constants/shared';
import React, { useEffect, useState } from 'react';
import { FlyoutContainers } from '../helpers/flyout_containers';
import { getNewVizDimensions, getQueryResponse, onTimeChange } from '../helpers/utils';
import { convertDateTime } from '../helpers/utils';
import { Plt } from '../../visualizations/plotly/plot';
import PPLService from '../../../services/requests/ppl';
import { CoreStart } from '../../../../../../src/core/public';
import {
  CUSTOM_PANELS_API_PREFIX,
  SavedVisualizationType,
  VisualizationType,
} from '../../../../common/constants/custom_panels';
import _ from 'lodash';

type Props = {
  closeFlyout: () => void;
  start: ShortDate;
  end: ShortDate;
  setToast: (title: string, color?: string, text?: string) => void;
  http: CoreStart['http'];
  pplService: PPLService;
  panelVisualizations: VisualizationType[];
  setPanelVisualizations: React.Dispatch<React.SetStateAction<VisualizationType[]>>;
  isFlyoutReplacement?: boolean | undefined;
  replaceVisualizationId?: string | undefined;
};

export const VisaulizationFlyout = ({
  closeFlyout,
  start,
  end,
  setToast,
  http,
  pplService,
  panelVisualizations,
  setPanelVisualizations,
  isFlyoutReplacement,
  replaceVisualizationId,
}: Props) => {
  const [newVisualizationTitle, setNewVisualizationTitle] = useState('');
  const [newVisualizationType, setNewVisualizationType] = useState('');
  const [pplQuery, setPPLQuery] = useState('');
  const [previewData, setPreviewData] = useState([]);
  const [previewArea, setPreviewArea] = useState(<></>);
  const [showPreviewArea, setShowPreviewArea] = useState(false);
  const [previewIconType, setPreviewIconType] = useState('arrowRight');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [isPreviewError, setIsPreviewError] = useState('');
  const [savedVisualizations, setSavedVisualizations] = useState<SavedVisualizationType[]>([]);
  const [visualizationOptions, setVisualizationOptions] = useState<EuiSelectOption[]>([]);
  const [selectValue, setSelectValue] = useState('');

  // DateTimePicker States
  const startDate = convertDateTime(start, true, false);
  const endDate = convertDateTime(end, false, false);

  const onPreviewClick = () => {
    if (previewIconType == 'arrowRight') {
      setPreviewIconType('arrowUp');
      setShowPreviewArea(true);
    } else {
      setPreviewIconType('arrowRight');
      setShowPreviewArea(false);
    }
  };

  const addVisualization = () => {
    if (selectValue === '') {
      setToast('Please make a valid selection', 'danger');
      return;
    }

    // Adding bang(!) operator here and the newdimensions cannot be null or undefined,
    // as they come from presaved visualization
    let newDimensions!: {
      x: number;
      y: number;
      w: number;
      h: number;
    };
    let visualizationsList = [] as VisualizationType[];

    if (isFlyoutReplacement) {
      panelVisualizations.map((visualization) => {
        if (visualization.id != replaceVisualizationId) {
          visualizationsList.push(visualization);
        } else {
          newDimensions = {
            x: visualization.x,
            y: visualization.y,
            w: visualization.w,
            h: visualization.h,
          };
        }
      });
    } else {
      visualizationsList = panelVisualizations;
      newDimensions = getNewVizDimensions(panelVisualizations);
    }

    setPanelVisualizations([
      ...visualizationsList,
      {
        id: 'panelViz_' + htmlIdGenerator()(),
        title: newVisualizationTitle,
        query: pplQuery,
        type: newVisualizationType,
        ...newDimensions,
      },
    ]);

    //NOTE: Add a backend call to add a visualization
    setToast(`Visualization ${newVisualizationTitle} successfully added!`, 'success');
    closeFlyout();
  };

  const onRefreshPreview = () => {
    if (convertDateTime(end, false) < convertDateTime(start)) {
      setToast('Invalid Time Interval', 'danger');
      return;
    }

    if (selectValue == '') {
      setToast('Please make a valid selection', 'danger');
      return;
    }

    getQueryResponse(
      pplService,
      pplQuery,
      newVisualizationType,
      start,
      end,
      setPreviewData,
      setPreviewLoading,
      setIsPreviewError,
      ''
    );
  };

  const timeRange = (
    <EuiFormRow label="Time Range">
      <EuiDatePickerRange
        readOnly
        startDateControl={
          <EuiDatePicker
            selected={startDate}
            startDate={startDate}
            endDate={endDate}
            isInvalid={startDate > endDate}
            aria-label="Start date"
            dateFormat={UI_DATE_FORMAT}
          />
        }
        endDateControl={
          <EuiDatePicker
            selected={endDate}
            startDate={startDate}
            endDate={endDate}
            isInvalid={startDate > endDate}
            aria-label="End date"
            dateFormat={UI_DATE_FORMAT}
          />
        }
      />
    </EuiFormRow>
  );

  const flyoutHeader = (
    <EuiFlyoutHeader hasBorder>
      <EuiTitle size="m">
        <h2 id="addVisualizationFlyout">
          {isFlyoutReplacement ? 'Replace Visualization' : 'Select Existing Visualization'}
        </h2>
      </EuiTitle>
    </EuiFlyoutHeader>
  );

  const onChangeSelection = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectValue(e.target.value);
  };

  const emptySavedVisualizations = (
    <EuiCallOut iconType="help">
      <p>No saved visualizations found!</p>
    </EuiCallOut>
  );

  const flyoutBody =
    savedVisualizations.length > 0 ? (
      <EuiFlyoutBody>
        <>
          <EuiSpacer size="l" />
          <EuiFormRow label="Visualization name">
            <EuiSelect
              hasNoInitialSelection
              onChange={(e) => onChangeSelection(e)}
              options={visualizationOptions}
            />
          </EuiFormRow>
          <EuiSpacer size="l" />
          <EuiSpacer size="l" />
          <EuiFlexGroup alignItems="center">
            <EuiFlexItem grow={false}>
              <EuiButtonEmpty
                iconSide="left"
                onClick={onPreviewClick}
                iconType={previewIconType}
                size="s"
                isLoading={previewLoading}
              >
                Preview
              </EuiButtonEmpty>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiButtonIcon
                aria-label="refreshPreview"
                iconType="refresh"
                aria-label="refresh-visualization"
                onClick={onRefreshPreview}
              />
            </EuiFlexItem>
          </EuiFlexGroup>
          <EuiSpacer size="m" />
          {showPreviewArea && previewArea}
          <EuiSpacer size="m" />
        </>
      </EuiFlyoutBody>
    ) : (
      <EuiFlyoutBody banner={emptySavedVisualizations}>
        <>
          <div>
            You don't have any saved visualizations. Please use the "create new visualization"
            option in add visualization menu.
          </div>
        </>
      </EuiFlyoutBody>
    );

  const flyoutFooter = (
    <EuiFlyoutFooter>
      <EuiFlexGroup gutterSize="s" justifyContent="spaceBetween">
        <EuiFlexItem grow={false}>
          <EuiButton onClick={closeFlyout}>Cancel</EuiButton>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiButton onClick={addVisualization} fill>
            Add
          </EuiButton>
        </EuiFlexItem>
      </EuiFlexGroup>
    </EuiFlyoutFooter>
  );

  // Fetch all saved visualizations
  const fetchSavedVisualizations = async () => {
    return http
      .get(`${CUSTOM_PANELS_API_PREFIX}/visualizations`)
      .then((res) => {
        if (res.visualizations.length > 0) {
          setSavedVisualizations(res.visualizations);
          setVisualizationOptions(
            res.visualizations.map((visualization: SavedVisualizationType) => {
              return { value: visualization.id, text: visualization.title };
            })
          );
        }
      })
      .catch((err) => {
        console.error('Issue in fetching the operational panels', err);
      });
  };

  useEffect(() => {
    const previewTemplate =
      isPreviewError == '' ? (
        <>
          {timeRange}
          <EuiFlexGroup>
            <EuiFlexItem style={{ minHeight: '200' }}>
              <Plt data={previewData} layout={{ showlegend: false }} />
            </EuiFlexItem>
          </EuiFlexGroup>
        </>
      ) : (
        <>
          {timeRange}
          <div style={{ minHeight: '200', overflow: 'scroll', textAlign: 'center' }}>
            <EuiSpacer size="l" />
            <EuiIcon type="alert" color="danger" size="l" />
            <EuiSpacer size="l" />
            <EuiText>
              <h2>Error in rendering the visualizaiton</h2>
            </EuiText>
            <EuiSpacer size="l" />
            <EuiText>
              <p>{isPreviewError}</p>
            </EuiText>
          </div>
        </>
      );

    setPreviewArea(previewTemplate);
  }, [previewLoading]);

  useEffect(() => {
    // On change of selected visualization change options
    for (var i = 0; i < savedVisualizations.length; i++) {
      const visualization = savedVisualizations[i];
      if (visualization.id === selectValue) {
        setPPLQuery(visualization.query);
        setNewVisualizationTitle(visualization.title);
        setNewVisualizationType(visualization.type);
        break;
      }
    }
  }, [selectValue]);

  useEffect(() => {
    // load saved visualizations
    fetchSavedVisualizations();
  }, []);

  return (
    <FlyoutContainers
      closeFlyout={closeFlyout}
      flyoutHeader={flyoutHeader}
      flyoutBody={flyoutBody}
      flyoutFooter={flyoutFooter}
      ariaLabel="addVisualizationFlyout"
    />
  );
};
