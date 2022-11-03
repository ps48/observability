import {
  EuiPageHeader,
  EuiPageHeaderSection,
  EuiTitle,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFieldText,
  EuiSelect,
  EuiSuperDatePicker,
  ShortDate,
  OnTimeChangeProps,
  EuiButton,
  EuiFieldSearch,
  EuiButtonIcon,
  EuiPopover,
  EuiPopoverFooter,
  EuiButtonEmpty,
  EuiComboBoxOptionOption,
} from '@elastic/eui';
import { DurationRange } from '@elastic/eui/src/components/date_picker/types';
import { uiSettingsService } from '../../../../common/utils';
import React, { useState } from 'react';
import { MetricType } from '../../../../common/types/metrics';
import { resolutionOptions } from '../../../../common/constants/metrics';
import { MetricsExportPanel } from './metrics_export_panel';
import { CoreStart } from '../../../../../../src/core/public';

import './top_menu.scss';
import { useSelector } from 'react-redux';
import { sortMetricLayout, updateMetricsWithSelections } from '../helpers/utils';
import { metricsLayoutSelector } from '../redux/slices/metrics_slice';
import SavedObjects from '../../../services/saved_objects/event_analytics/saved_objects';

interface TopMenuProps {
  http: CoreStart['http'];
  IsTopPanelDisabled: boolean;
  startTime: ShortDate;
  endTime: ShortDate;
  onDatePickerChange: (props: OnTimeChangeProps) => void;
  recentlyUsedRanges: DurationRange[];
  editMode: boolean;
  setEditMode: React.Dispatch<React.SetStateAction<boolean>>;
  setEditActionType: React.Dispatch<React.SetStateAction<string>>;
  panelVisualizations: MetricType[];
  setPanelVisualizations: React.Dispatch<React.SetStateAction<MetricType[]>>;
  resolutionValue: string;
  setResolutionValue: React.Dispatch<React.SetStateAction<string>>;
  spanValue: number;
  setSpanValue: React.Dispatch<React.SetStateAction<number>>;
  resolutionSelectId: string;
  savedObjects: SavedObjects;
}

export const TopMenu = ({
  http,
  IsTopPanelDisabled,
  startTime,
  endTime,
  onDatePickerChange,
  recentlyUsedRanges,
  editMode,
  setEditActionType,
  setEditMode,
  panelVisualizations,
  setPanelVisualizations,
  resolutionValue,
  setResolutionValue,
  spanValue,
  setSpanValue,
  resolutionSelectId,
  savedObjects,
}: TopMenuProps) => {
  // Redux tools
  const metricsLayout = useSelector(metricsLayoutSelector);
  const sortedMetricsLayout = sortMetricLayout([...metricsLayout]);

  const [visualizationsMetaData, setVisualizationsMetaData] = useState<any>([]);
  const [originalPanelVisualizations, setOriginalPanelVisualizations] = useState<MetricType[]>([]);
  const [isSavePanelOpen, setIsSavePanelOpen] = useState(false);
  const [selectedPanelOptions, setSelectedPanelOptions] = useState<
    EuiComboBoxOptionOption<unknown>[] | undefined
  >([]);

  // toggle between panel edit mode
  const editPanel = (editType: string) => {
    setEditMode(!editMode);
    switch (editType) {
      case 'edit': {
        setOriginalPanelVisualizations([...panelVisualizations]);
        break;
      }
      case 'cancel': {
        setPanelVisualizations(originalPanelVisualizations);
        setOriginalPanelVisualizations([]);
        break;
      }
      default: {
        break;
      }
    }
    setEditActionType(editType);
  };

  const onResolutionChange = (e) => {
    setResolutionValue(e.target.value);
  };

  const cancelButton = (
    <EuiButton size="s" iconType="cross" color="danger" onClick={() => editPanel('cancel')}>
      Cancel
    </EuiButton>
  );

  const saveButton = (
    <EuiButton size="s" iconType="save" onClick={() => editPanel('save')}>
      Save view
    </EuiButton>
  );

  const editButton = (
    <EuiButton
      size="s"
      iconType="pencil"
      onClick={() => editPanel('edit')}
      isDisabled={IsTopPanelDisabled}
    >
      Edit view
    </EuiButton>
  );

  const Savebutton = (
    <EuiButton
      iconSide="right"
      onClick={() => {
        setIsSavePanelOpen((staleState) => !staleState);
      }}
      data-test-subj="metrics__saveManagementPopover"
      iconType="arrowDown"
      isDisabled={IsTopPanelDisabled}
    >
      Save
    </EuiButton>
  );

  const handleSavingObjects = async () => {
    let savedMetricIds = [];
    let savedMetricsInPanels = [];
    // const allSelectedPanelIds = selectedPanelOptions.map((panelOption) => panelOption.panel.id);

    try {
      savedMetricIds = await Promise.all(
        sortedMetricsLayout.map(async (metricLayout, index) => {
          const updatedMetric = updateMetricsWithSelections(
            visualizationsMetaData[index],
            startTime,
            endTime,
            spanValue + resolutionValue
          );

          if (metricLayout.metricType === 'prometheusMetric') {
            return await savedObjects.createSavedVisualization(updatedMetric);
          } else {
            return await savedObjects.updateSavedVisualizationById({
              ...updatedMetric,
              objectId: metricLayout.id,
            });
          }
        })
      );
      console.log('savedMetricIds', savedMetricIds);
    } catch (e) {
      console.error('Issue in saving metrics');
    }

    try {
      console.log('allSelectedPanelIds', selectedPanelOptions);
      savedMetricsInPanels = await Promise.all(
        savedMetricIds.map(async (metricObject) => {
          return await savedObjects.bulkUpdateCustomPanel({
            selectedCustomPanels: selectedPanelOptions,
            savedVisualizationId: metricObject.objectId,
          });
        })
      );

      console.log('savedMetricsInPanels', savedMetricsInPanels);
    } catch (e) {
      console.error('Issue in saving metrics to panels');
    }

    // console.log('savedMetricIds', savedMetricIds);
  };
  return (
    <>
      <EuiPageHeader>
        <EuiPageHeaderSection>
          <EuiFlexGroup className="search-bar-top-menu">
            <EuiFlexItem>
              <EuiFieldSearch
                placeholder="Search metrics"
                isClearable={true}
                aria-label="Use aria labels when no actual label is in use"
                fullWidth={true}
              />
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiButtonIcon iconType="menuLeft"></EuiButtonIcon>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiPageHeaderSection>
        <EuiPageHeaderSection>
          <EuiFlexGroup gutterSize="s">
            <EuiFlexItem grow={false}>
              <div className="resolutionSelect">
                <EuiFieldText
                  className="resolutionSelectText"
                  prepend="Span Interval"
                  value={spanValue}
                  onChange={(e) => setSpanValue(e.target.value)}
                  append={
                    <EuiSelect
                      id={resolutionSelectId}
                      options={resolutionOptions}
                      value={resolutionValue}
                      onChange={(e) => onResolutionChange(e)}
                      aria-label="resolutionSelect"
                    />
                  }
                  disabled={IsTopPanelDisabled}
                  aria-label="resolutionField"
                />
              </div>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiSuperDatePicker
                dateFormat={uiSettingsService.get('dateFormat')}
                start={startTime}
                end={endTime}
                onTimeChange={onDatePickerChange}
                recentlyUsedRanges={recentlyUsedRanges}
                isDisabled={IsTopPanelDisabled}
              />
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiPopover
                button={Savebutton}
                isOpen={isSavePanelOpen}
                closePopover={() => setIsSavePanelOpen(false)}
              >
                <MetricsExportPanel
                  http={http}
                  visualizationsMetaData={visualizationsMetaData}
                  setVisualizationsMetaData={setVisualizationsMetaData}
                  sortedMetricsLayout={sortedMetricsLayout}
                  selectedPanelOptions={selectedPanelOptions}
                  setSelectedPanelOptions={setSelectedPanelOptions}
                />
                <EuiPopoverFooter>
                  <EuiFlexGroup justifyContent="flexEnd">
                    <EuiFlexItem grow={false}>
                      <EuiButtonEmpty
                        size="s"
                        onClick={() => setIsSavePanelOpen(false)}
                        data-test-subj="metrics__SaveCancel"
                      >
                        Cancel
                      </EuiButtonEmpty>
                    </EuiFlexItem>
                    <EuiFlexItem grow={false}>
                      <EuiButton
                        size="s"
                        fill
                        onClick={() => {
                          handleSavingObjects().then(() => setIsSavePanelOpen(false));
                        }}
                        data-test-subj="metrics__SaveConfirm"
                      >
                        Save
                      </EuiButton>
                    </EuiFlexItem>
                  </EuiFlexGroup>
                </EuiPopoverFooter>
              </EuiPopover>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiPageHeaderSection>
      </EuiPageHeader>
      <EuiFlexGroup gutterSize="s" justifyContent="flexEnd">
        {editMode ? (
          <>
            <EuiFlexItem grow={false}>{cancelButton}</EuiFlexItem>
            <EuiFlexItem grow={false}>{saveButton}</EuiFlexItem>
          </>
        ) : (
          <EuiFlexItem grow={false}>{editButton}</EuiFlexItem>
        )}
      </EuiFlexGroup>
    </>
  );
};
