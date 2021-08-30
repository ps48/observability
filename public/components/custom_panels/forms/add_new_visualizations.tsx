import {
  EuiSpacer,
  EuiFormRow,
  EuiFieldText,
  EuiLink,
  EuiTextArea,
  EuiButtonEmpty,
  EuiButton,
  EuiFlexGroup,
  EuiFlexItem,
  EuiButtonIcon,
  EuiIcon,
  EuiText,
  EuiSuperDatePicker,
} from '@elastic/eui';
import { htmlIdGenerator } from '@elastic/eui/lib/services';
import _ from 'lodash';
import React, { Fragment, useEffect, useState } from 'react';
import { VisualizationType } from '../../../../common/constants/custom_panels';
import PPLService from '../../../services/requests/ppl';
import { PlotSample } from '../helpers/plot_sample';
import {
  convertDateTime,
  getNewVizDimensions,
  getQueryResponse,
  isNameValid,
} from '../helpers/utils';

/*
 * "AddNewVisualizations" component to add new visualizations using PPL Queries
 *
 * closeVizWindow: function to close "add visualization" window
 * pplService: PPLService Requestor 
 * panelVisualizations: panelVisualizations object 
 * setPanelVisualizations: Setter for panelVisualizations object
 * setToast: Create Toast function 
 */

type Props = {
  closeVizWindow: () => void;
  pplService: PPLService;
  panelVisualizations: VisualizationType[];
  setPanelVisualizations: React.Dispatch<React.SetStateAction<VisualizationType[]>>;
  setToast: (title: string, color?: string, text?: string) => void;
};

export const AddNewVisualizations = ({
  closeVizWindow,
  pplService,
  panelVisualizations,
  setPanelVisualizations,
  setToast,
}: Props) => {
  const [newVisualizationTitle, setNewVisualizationTitle] = useState('');
  const [newVisualizationType, setNewVisualizationType] = useState('bar');
  const [pplQuery, setPPLQuery] = useState('');
  const [previewData, setPreviewData] = useState([]);
  const [previewArea, setPreviewArea] = useState(<></>);
  const [showPreviewArea, setShowPreviewArea] = useState(false);
  const [previewIconType, setPreviewIconType] = useState('arrowRight');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [isPreviewError, setIsPreviewError] = useState('');

  // DateTimePicker States
  const [recentlyUsedRanges, setRecentlyUsedRanges] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [start, setStart] = useState('now-30m');
  const [end, setEnd] = useState('now');

  const onTimeChange = ({ start, end }) => {
    const recentlyUsedRange = recentlyUsedRanges.filter((recentlyUsedRange) => {
      const isDuplicate = recentlyUsedRange.start === start && recentlyUsedRange.end === end;
      return !isDuplicate;
    });
    recentlyUsedRange.unshift({ start, end });
    setStart(start);
    setEnd(end);
    setRecentlyUsedRanges(
      recentlyUsedRange.length > 10 ? recentlyUsedRange.slice(0, 9) : recentlyUsedRange
    );
    setIsLoading(true);
    startLoading();
  };

  const startLoading = () => {
    setTimeout(stopLoading, 1000);
  };

  const stopLoading = () => {
    setIsLoading(false);
  };

  const onPreviewClick = () => {
    if (previewIconType == 'arrowRight') {
      setPreviewIconType('arrowUp');
      setShowPreviewArea(true);
    } else {
      setPreviewIconType('arrowRight');
      setShowPreviewArea(false);
    }
  };

  const onRefreshPreview = () => {
    if (convertDateTime(end, false) < convertDateTime(start)) {
      setToast('Invalid Time Interval', 'danger');
      return;
    }

    getQueryResponse(
      pplService,
      pplQuery,
      'bar',
      start,
      end,
      setPreviewData,
      setPreviewLoading,
      setIsPreviewError
    );
  };

  useEffect(() => {
    const previewTemplate =
      isPreviewError == '' ? (
        <>
          <EuiFlexGroup>
            <EuiFlexItem style={{ minHeight: '200' }}>
              <PlotSample data={previewData} layout={{ showlegend: false }} />
            </EuiFlexItem>
          </EuiFlexGroup>
        </>
      ) : (
        <>
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

  const onChangeText = (
    e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement>,
    setter: React.Dispatch<React.SetStateAction<string>>
  ) => {
    setter(e.target.value);
  };

  const advancedVisualization = () => {
    //NOTE: Add Redux functions to pass pplquery and time filters to events page
    window.location.assign('#/explorer/events');
  };

  const addVisualization = () => {
    if (!isNameValid(newVisualizationTitle)) {
      setToast('Invalid Visualization Name', 'danger');
      return;
    }

    if (pplQuery.length == 0) {
      setToast('Invalid PPL Query', 'danger');
      return;
    }

    const newDimensions = getNewVizDimensions(panelVisualizations);
    setPanelVisualizations([
      ...panelVisualizations,
      {
        id: htmlIdGenerator()(),
        title: newVisualizationTitle,
        query: _.escape(pplQuery),
        type: newVisualizationType,
        ...newDimensions,
      },
    ]);

    //NOTE: Add a backend call to add a visualization
    setToast(`Visualization ${newVisualizationTitle} successfully added!`, 'success');
    closeVizWindow();
  };

  return (
    <>
      <EuiSpacer size="l" />
      <EuiFormRow
        label="Visualization name"
        helpText="Enter a unique and descriptive name between 1-50 characters."
      >
        <EuiFieldText
          name="Name"
          value={newVisualizationTitle}
          onChange={(e) => onChangeText(e, setNewVisualizationTitle)}
        />
      </EuiFormRow>
      <EuiFormRow
        label="PPL Query"
        helpText={
          <Fragment>
            Use [example commands] to draw visaulizations.{' '}
            <EuiLink href="https://opensearch.org/docs/search-plugins/ppl/index/" target="_blank">
              Learn More
            </EuiLink>{' '}
          </Fragment>
        }
        fullWidth={true}
      >
        <EuiTextArea
          placeholder="Placeholder text"
          aria-label="Use aria labels when no actual label is in use"
          value={pplQuery}
          onChange={(e) => onChangeText(e, setPPLQuery)}
          fullWidth={true}
          style={{ width: '80%' }}
        />
      </EuiFormRow>
      <EuiFormRow label="Time Range">
        <EuiSuperDatePicker
          isLoading={isLoading}
          dateFormat="MM/DD/YYYY hh:mm:ss A"
          start={start}
          end={end}
          onTimeChange={onTimeChange}
          showUpdateButton={false}
          recentlyUsedRanges={recentlyUsedRanges}
        />
      </EuiFormRow>
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
            iconType="refresh"
            aria-label="refresh-visualization"
            onClick={onRefreshPreview}
          />
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiSpacer size="m" />
      {showPreviewArea && previewArea}
      <EuiButtonEmpty iconSide="left" iconType="brush" size="s" onClick={advancedVisualization}>
        More advanced edit options in visual editor...
      </EuiButtonEmpty>
      <EuiSpacer size="m" />
      <EuiFlexGroup gutterSize="s">
        <EuiFlexItem grow={false}>
          <EuiButton onClick={addVisualization} fill>
            Add
          </EuiButton>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiButton onClick={closeVizWindow}>Cancel</EuiButton>
        </EuiFlexItem>
      </EuiFlexGroup>
    </>
  );
};
