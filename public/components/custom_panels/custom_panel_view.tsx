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
  EuiBreadcrumb,
  EuiButton,
  EuiContextMenu,
  EuiFieldText,
  EuiFlexGroup,
  EuiFlexItem,
  EuiOverlayMask,
  EuiPage,
  EuiPageBody,
  EuiPageContentBody,
  EuiPageHeader,
  EuiPageHeaderSection,
  EuiPopover,
  EuiSpacer,
  EuiSuperDatePicker,
  EuiSuperDatePickerProps,
  EuiTitle,
  htmlIdGenerator,
  ShortDate,
} from '@elastic/eui';
import _ from 'lodash';
import React, { useEffect, useState } from 'react';
import { CoreStart } from '../../../../../src/core/public';
import { EmptyPanelView } from './panel_modules/empty_panel';
import { AddVizView } from './panel_modules/add_visualization';
import {
  RENAME_VISUALIZATION_MESSAGE,
  CREATE_PANEL_MESSAGE,
  CUSTOM_PANELS_API_PREFIX,
  VisualizationType,
} from '../../../common/constants/custom_panels';
import { PanelGrid } from './panel_modules/panel_grid';
import {
  DeletePanelModal,
  DeleteVisualizationModal,
  getCustomModal,
} from './helpers/modal_containers';
import PPLService from '../../services/requests/ppl';
import { convertDateTime, getNewVizDimensions, onTimeChange } from './helpers/utils';
import { DurationRange } from '@elastic/eui/src/components/date_picker/types';
import { UI_DATE_FORMAT } from '../../../common/constants/shared';
import { ChangeEvent } from 'react';
import moment from 'moment';
import { AddVisualizationFlyout } from './panel_modules/add_visualization_flyout';

/*
 * "CustomPanelsView" module used to render an Operational Panel
 * panelId: Name of the panel opened
 * http: http core service
 * pplService: ppl requestor service
 * chrome: chrome core service
 * parentBreadcrumb: parent breadcrumb
 * renameCustomPanel: Rename function for the panel
 * deleteCustomPanel: Delete function for the panel
 * setToast: create Toast function
 */

type Props = {
  panelId: string;
  http: CoreStart['http'];
  pplService: PPLService;
  chrome: CoreStart['chrome'];
  parentBreadcrumb: EuiBreadcrumb[];
  renameCustomPanel: (newCustomPanelName: string, customPanelId: string) => void;
  deleteCustomPanel: (customPanelId: string, customPanelName?: string, showToast?: boolean) => void;
  setToast: (title: string, color?: string, text?: string) => void;
};

export const CustomPanelView = ({
  panelId,
  http,
  pplService,
  chrome,
  parentBreadcrumb,
  renameCustomPanel,
  deleteCustomPanel,
  setToast,
}: Props) => {
  const [openPanelName, setOpenPanelName] = useState('');
  const [panelCreatedTime, setPanelCreatedTime] = useState('');
  const [pplFilterValue, setPPLFilterValue] = useState('');
  const [onRefresh, setOnRefresh] = useState(false);

  const [inputDisabled, setInputDisabled] = useState(true);
  const [addVizDisabled, setAddVizDisabled] = useState(false);
  const [editDisabled, setEditDisabled] = useState(false);
  const [showVizPanel, setShowVizPanel] = useState(false);
  const [panelVisualizations, setPanelVisualizations] = useState<Array<VisualizationType>>([]);
  const [editMode, setEditMode] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false); // Modal Toggle
  const [modalLayout, setModalLayout] = useState(<EuiOverlayMask></EuiOverlayMask>); // Modal Layout
  const [isVizPopoverOpen, setVizPopoverOpen] = useState(false); // Add Visualization Popover
  const [isFlyoutVisible, setIsFlyoutVisible] = useState(false); // Add Visualization Flyout

  // DateTimePicker States
  const [recentlyUsedRanges, setRecentlyUsedRanges] = useState<DurationRange[]>([]);
  const [start, setStart] = useState<ShortDate>('now-30m');
  const [end, setEnd] = useState<ShortDate>('now');

  const vizContextPanels = [
    {
      id: 0,
      title: 'Add Visualization',
      items: [
        {
          name: 'Select Existing Visualization',
          onClick: () => {
            addVizWindow();
          },
        },
        {
          name: 'Create New Visualization',
          onClick: () => {
            advancedVisualization();
          },
        },
      ],
    },
  ];

  const advancedVisualization = () => {
    closeVizPopover();
    //NOTE: Add Redux functions to pass pplquery and time filters to events page
    window.location.assign('#/explorer/events');
  };

  // Fetch Panel by id
  const fetchCustomPanel = async () => {
    return http
      .get(`${CUSTOM_PANELS_API_PREFIX}/panels/${panelId}`)
      .then((res) => {
        setOpenPanelName(res.panel.name);
        setPanelCreatedTime(res.panel.dateCreated);
        setPanelVisualizations(res.panel.visualizations);
        setPPLFilterValue(_.unescape(res.panel.queryFilter.query));
        setStart(res.panel.timeRange.from);
        setEnd(res.panel.timeRange.to);
      })
      .catch((err) => {
        console.error('Issue in fetching the operational panels', err);
      });
  };

  const onPopoverClick = () => {
    setVizPopoverOpen(!isVizPopoverOpen);
  };

  const closeVizPopover = () => {
    setVizPopoverOpen(false);
  };

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPPLFilterValue(e.target.value);
  };

  const closeModal = () => {
    setIsModalVisible(false);
  };

  const showModal = () => {
    setIsModalVisible(true);
  };

  const onDelete = async () => {
    const toastMessage = `Operational Panel ${openPanelName} successfully deleted!`;
    deleteCustomPanel(panelId, openPanelName);
    closeModal();
  };

  const deletePanel = () => {
    setModalLayout(
      <DeletePanelModal
        onConfirm={onDelete}
        onCancel={closeModal}
        title={`Delete ${openPanelName}`}
        message={`Are you sure you want to delete this Operational Panel?`}
      />
    );
    showModal();
  };

  const onRename = async (newCustomPanelName: string) => {
    renameCustomPanel(newCustomPanelName, panelId);
    closeModal();
  };

  const renamePanel = () => {
    setModalLayout(
      getCustomModal(
        onRename,
        closeModal,
        'Name',
        'Rename Panel',
        'Cancel',
        'Rename',
        openPanelName,
        CREATE_PANEL_MESSAGE
      )
    );
    showModal();
  };

  // toggle between panel edit mode
  const editPanel = () => {
    setEditMode(!editMode);
    setShowVizPanel(false);
  };

  const closeVizWindow = () => {
    //setShowVizPanel(false);
    setIsFlyoutVisible(false);
    setAddVizDisabled(false);
    checkDisabledInputs();
  };

  const addVizWindow = () => {
    // setShowVizPanel(true);
    closeVizPopover();
    setIsFlyoutVisible(true);
    setAddVizDisabled(true);
    setInputDisabled(true);
  };

  const checkDisabledInputs = () => {
    if (panelVisualizations.length == 0) {
      setEditDisabled(true);
      setInputDisabled(true);
    } else {
      setEditDisabled(false);
      if (editMode) setInputDisabled(true);
      else setInputDisabled(false);
    }
    if (editMode) setAddVizDisabled(true);
    else setAddVizDisabled(false);
  };

  const onRefreshFilters = () => {
    setOnRefresh(!onRefresh);
  };

  const cloneVisualization = (
    newVisualizationTitle: string,
    pplQuery: string,
    newVisualizationType: string
  ) => {
    setModalLayout(
      getCustomModal(
        onCloneVisualization,
        closeModal,
        'Name',
        'Duplicate Visualization',
        'Cancel',
        'Duplicate',
        newVisualizationTitle + ' (copy)',
        RENAME_VISUALIZATION_MESSAGE,
        pplQuery,
        newVisualizationType
      )
    );
    showModal();
  };

  const onCloneVisualization = (
    newVisualizationTitle: string,
    pplQuery: string,
    newVisualizationType: string
  ) => {
    const newDimensions = getNewVizDimensions(panelVisualizations);
    setPanelVisualizations([
      ...panelVisualizations,
      {
        id: htmlIdGenerator()(),
        title: newVisualizationTitle,
        query: pplQuery,
        type: newVisualizationType,
        ...newDimensions,
      },
    ]);

    //NOTE: Make a backend call to Clone Visualization
    closeModal();
  };

  const deleteVisualization = (visualizationId: string, visualizationName: string) => {
    setModalLayout(
      <DeleteVisualizationModal
        onConfirm={onDeleteVisualization}
        onCancel={closeModal}
        visualizationId={visualizationId}
        visualizationName={visualizationName}
        panelName={openPanelName}
      />
    );
    showModal();
  };

  const onDeleteVisualization = (visualizationId: string) => {
    const filteredPanelVisualizations = panelVisualizations.filter(
      (panelVisualization) => panelVisualization.id != visualizationId
    );
    setPanelVisualizations([...filteredPanelVisualizations]);

    //NOTE: Make a backend call to Delete Visualization
    closeModal();
  };

  //Add Visualization Button
  const addVisualizationButton = (
    <EuiButton
      iconType="arrowDown"
      iconSide="right"
      disabled={addVizDisabled}
      onClick={onPopoverClick}
      fill
    >
      Add Visualization
    </EuiButton>
  );

  let flyout;
  if (isFlyoutVisible) {
    flyout = (
      <AddVisualizationFlyout
        closeVizWindow={closeVizWindow}
        start={start}
        end={end}
        setToast={setToast}
        http={http}
        pplService={pplService}
        panelVisualizations={panelVisualizations}
        setPanelVisualizations={setPanelVisualizations}
      />
    );
  }

  // Fetch the custom panel on Initial Mount
  useEffect(() => {
    fetchCustomPanel();
  }, []);

  // Check Validity of Time
  useEffect(() => {
    if (convertDateTime(end, false) < convertDateTime(start)) {
      setToast('Invalid Time Interval', 'danger');
      return;
    }
  }, [start, end]);

  // Toggle input type (disabled or not disabled)
  // Disabled when there no visualizations in panels or when the panel is in edit mode
  useEffect(() => {
    checkDisabledInputs();
  }, [panelVisualizations, editMode]);

  // Edit the breadcurmb when panel name changes
  useEffect(() => {
    chrome.setBreadcrumbs([
      ...parentBreadcrumb,
      { text: openPanelName, href: `${_.last(parentBreadcrumb).href}${panelId}` },
    ]);
  }, [openPanelName]);

  return (
    <div>
      <EuiPage>
        <EuiPageBody component="div">
          <EuiPageHeader>
            <EuiPageHeaderSection>
              <EuiTitle size="l">
                <h1>{openPanelName}</h1>
              </EuiTitle>
              <EuiFlexItem>
                <EuiSpacer size="s" />
              </EuiFlexItem>
              Created on {moment(panelCreatedTime).format(UI_DATE_FORMAT)}
            </EuiPageHeaderSection>
            <EuiPageHeaderSection>
              <EuiFlexGroup gutterSize="s">
                <EuiFlexItem>
                  <EuiButton color="danger" onClick={deletePanel}>
                    Delete
                  </EuiButton>
                </EuiFlexItem>
                <EuiFlexItem>
                  <EuiButton onClick={renamePanel}>Rename</EuiButton>
                </EuiFlexItem>
                <EuiFlexItem>
                  <EuiButton>Export</EuiButton>
                </EuiFlexItem>
                <EuiFlexItem>
                  <EuiButton
                    iconType={editMode ? 'save' : 'pencil'}
                    onClick={editPanel}
                    disabled={editDisabled}
                  >
                    {editMode ? 'Save' : 'Edit'}
                  </EuiButton>
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiPageHeaderSection>
          </EuiPageHeader>
          <EuiPageContentBody>
            <EuiFlexGroup gutterSize="s">
              <EuiFlexItem>
                <EuiFieldText
                  placeholder="Use PPL to query log indices below. Use “source=” to quickly switch to a different index."
                  value={pplFilterValue}
                  fullWidth={true}
                  onChange={(e) => onChange(e)}
                  disabled={inputDisabled}
                />
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiSuperDatePicker
                  dateFormat={UI_DATE_FORMAT}
                  start={start}
                  end={end}
                  onTimeChange={(props: Readonly<EuiSuperDatePickerProps>) =>
                    onTimeChange(
                      props.start,
                      props.end,
                      recentlyUsedRanges,
                      setRecentlyUsedRanges,
                      setStart,
                      setEnd
                    )
                  }
                  showUpdateButton={false}
                  recentlyUsedRanges={recentlyUsedRanges}
                />
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiButton isDisabled={inputDisabled} onClick={onRefreshFilters}>
                  Refresh
                </EuiButton>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiPopover
                  id="addVisualizationContextMenu"
                  button={addVisualizationButton}
                  isOpen={isVizPopoverOpen}
                  closePopover={closeVizPopover}
                  panelPaddingSize="none"
                  anchorPosition="downLeft"
                >
                  <EuiContextMenu initialPanelId={0} panels={vizContextPanels} />
                </EuiPopover>
              </EuiFlexItem>
            </EuiFlexGroup>
            <EuiSpacer size="l" />
            {panelVisualizations.length == 0 ? (
              !showVizPanel && (
                <EmptyPanelView
                  addVizWindow={addVizWindow}
                  addVizDisabled={addVizDisabled}
                  vizContextPanels={vizContextPanels}
                />
              )
            ) : (
              <PanelGrid
                chrome={chrome}
                panelVisualizations={panelVisualizations}
                editMode={editMode}
                pplService={pplService}
                startTime={start}
                endTime={end}
                onRefresh={onRefresh}
                cloneVisualization={cloneVisualization}
                deleteVisualization={deleteVisualization}
                pplFilterValue={pplFilterValue}
              />
            )}
            <>
              {/* {showVizPanel && (
                <AddVizView
                  closeVizWindow={closeVizWindow}
                  pplService={pplService}
                  panelVisualizations={panelVisualizations}
                  setPanelVisualizations={setPanelVisualizations}
                  setToast={setToast}
                />
              )} */}
            </>
          </EuiPageContentBody>
        </EuiPageBody>
      </EuiPage>
      {isModalVisible && modalLayout}
      {flyout}
    </div>
  );
};
