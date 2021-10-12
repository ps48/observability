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

import dateMath from '@elastic/datemath';
import { ShortDate } from '@elastic/eui';
import { DurationRange } from '@elastic/eui/src/components/date_picker/types';
import _, { isEmpty } from 'lodash';
import { Moment } from 'moment-timezone';
import { VisualizationType } from '../../../../common/types/custom_panels';
import {
  PPL_CONTAINS_TIMESTAMP_REGEX,
  PPL_DATE_FORMAT,
  PPL_FIELDS_REGEX,
  PPL_INDEX_REGEX,
} from '../../../../common/constants/shared';
import PPLService from '../../../services/requests/ppl';
import { insertFieldsToQuery } from '../../../../common/utils';
import { Plt } from '../../visualizations/plotly/plot';
import React from 'react';
import { Bar } from '../../visualizations/charts/bar';
import { HorizontalBar } from '../../visualizations/charts/horizontal_bar';
import { Line } from '../../visualizations/charts/line';

/*
 * "Utils" This file contains different reused functions in operational panels
 */

// Name validation 0>Name<=50
export const isNameValid = (name: string) => {
  return name.length >= 50 || name.length === 0 ? false : true;
};

// DateTime convertor to required format
export const convertDateTime = (datetime: string, isStart = true, formatted = true) => {
  let returnTime: undefined | Moment;
  if (isStart) {
    returnTime = dateMath.parse(datetime);
  } else {
    returnTime = dateMath.parse(datetime, { roundUp: true });
  }

  if (formatted) return returnTime.format(PPL_DATE_FORMAT);
  return returnTime;
};

// Builds Final Query by adding time and query filters(From panel UI) to the original visualization query
// -> Final Query is as follows:
// -> finalQuery = indexPartOfQuery + timeQueryFilter + panelFilterQuery + filterPartOfQuery
// -> finalQuery = source=opensearch_dashboards_sample_data_flights
//                  + | where utc_time > timestamp(‘2021-07-01 00:00:00’) and utc_time < timestamp(‘2021-07-02 00:00:00’)
//                  + | where Carrier='OpenSearch-Air'
//                  + | stats sum(FlightDelayMin) as delays by Carrier
const queryAccumulator = (
  originalQuery: string,
  timestampField: string,
  startTime: string,
  endTime: string,
  panelFilterQuery: string
) => {
  const indexMatchArray = originalQuery.match(PPL_INDEX_REGEX);
  if (indexMatchArray == null) {
    throw Error('index not found in Query');
  }
  const indexPartOfQuery = indexMatchArray[0];
  const filterPartOfQuery = originalQuery.replace(PPL_INDEX_REGEX, '');
  const timeQueryFilter = ` | where ${timestampField} >= timestamp('${convertDateTime(
    startTime
  )}') and ${timestampField} <= timestamp('${convertDateTime(endTime, false)}')`;
  const pplFilterQuery = panelFilterQuery === '' ? '' : ` | ${panelFilterQuery}`;
  return indexPartOfQuery + timeQueryFilter + pplFilterQuery + filterPartOfQuery;
};

//PPL Service requestor
const pplServiceRequestor = async (
  pplService: PPLService,
  finalQuery: string,
  type: string,
  setVisualizationData: React.Dispatch<React.SetStateAction<any[]>>,
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>,
  setIsError: React.Dispatch<React.SetStateAction<string>>
) => {
  await pplService
    .fetch({ query: finalQuery, format: 'viz' })
    .then((res) => {
      // console.log('response,', res);
      if (res === undefined) setIsError('Please check the PPL Filter Value');
      setVisualizationData(res);
    })
    .catch((error: Error) => {
      setIsError(error.stack);
      console.error(error);
    })
    .finally(() => {
      setIsLoading(false);
    });
};

// Get PPL Query Response
export const getQueryResponse = (
  pplService: PPLService,
  query: string,
  type: string,
  startTime: string,
  endTime: string,
  setVisualizationData: React.Dispatch<React.SetStateAction<any[]>>,
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>,
  setIsError: React.Dispatch<React.SetStateAction<string>>,
  filterQuery = '',
  timestampField = 'timestamp'
) => {
  setIsLoading(true);
  setIsError('');

  let finalQuery = '';
  try {
    finalQuery = queryAccumulator(query, timestampField, startTime, endTime, filterQuery);
  } catch (error) {
    console.log('Issue in building final query', error.stack);
    setIsLoading(false);
    return;
  }

  pplServiceRequestor(pplService, finalQuery, type, setVisualizationData, setIsLoading, setIsError);
};

// Calculate new visualization dimensions
// New visualization always joins to the end of the panel
export const getNewVizDimensions = (panelVisualizations: VisualizationType[]) => {
  let maxY: number = 0,
    maxYH: number = 0;

  panelVisualizations.map((panelVisualization: VisualizationType) => {
    if (maxY < panelVisualization.y) {
      maxY = panelVisualization.y;
      maxYH = panelVisualization.h;
    }
  });

  return { x: 0, y: maxY + maxYH, w: 6, h: 4 };
};

// Function to store recently used time filters and set start and end time.
export const onTimeChange = (
  start: ShortDate,
  end: ShortDate,
  recentlyUsedRanges: DurationRange[],
  setRecentlyUsedRanges: React.Dispatch<React.SetStateAction<DurationRange[]>>,
  setStart: React.Dispatch<React.SetStateAction<string>>,
  setEnd: React.Dispatch<React.SetStateAction<string>>
) => {
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
};

// Function to check date validity
export const isDateValid = (
  start: string | Moment | undefined,
  end: string | Moment | undefined,
  setToast: (
    title: string,
    color?: string,
    text?: React.ReactChild | undefined,
    side?: string | undefined
  ) => void,
  side?: string | undefined
) => {
  if (end! < start!) {
    setToast('Time range entered is invalid', 'danger', undefined, side);
    return false;
  } else return true;
};

// Check for filed filter in query
const checkFieldsExists = (query: string) => {
  return PPL_FIELDS_REGEX.test(query);
};

// Check for time filter in query
const checkTimeRangeExists = (query: string) => {
  return PPL_CONTAINS_TIMESTAMP_REGEX.test(query);
};

// Check for time filter in query
const checkIndexExists = (query: string) => {
  return PPL_INDEX_REGEX.test(query);
};

// savedObjects Visualzation Query Builder
// Adds fields in query and removes time filter
export const savedVisualizationsQueryBuilder = (
  query: string,
  fields: { text: string; tokens: string[] }
) => {
  let finalQuery = '';
  finalQuery = query; //insertFieldsToQuery({ rawQuery: query, fields: fields.tokens });
  finalQuery = checkTimeRangeExists(finalQuery)
    ? finalQuery.replace(PPL_CONTAINS_TIMESTAMP_REGEX, '')
    : finalQuery;
  return finalQuery;
};

// Check PPL Query in Panel UI
// Validate if the query doesn't contain any Index/Time/Field filters
export const isPPLFilterValid = (
  query: string,
  setToast: (
    title: string,
    color?: string,
    text?: React.ReactChild | undefined,
    side?: string | undefined
  ) => void
) => {
  if (checkIndexExists(query)) {
    setToast('Please remove index from PPL Filter', 'danger', undefined);
    return false;
  }

  if (checkTimeRangeExists(query)) {
    setToast('Please remove time filter from PPL Filter', 'danger', undefined);
    return false;
  }

  if (checkFieldsExists(query)) {
    setToast('Please remove fields from PPL Filter', 'danger', undefined);
    return false;
  }

  return true;
};

// This function renders the visualzation based of its type
export const displayVisualization = (data: any, type: string) => {
  if (data === undefined) return;
  // console.log('in charts rendering');
  let vizComponent!: JSX.Element;
  switch (type) {
    case 'bar': {
      vizComponent = (
        <Bar
          visualizations={data}
          layoutConfig={{
            yaxis: {
              automargin: true,
            },
          }}
        />
      );
      break;
    }
    case 'horizontalBar': {
      vizComponent = (
        <HorizontalBar
          visualizations={data}
          layoutConfig={{
            yaxis: {
              automargin: true,
            },
          }}
        />
      );
      break;
    }
    case 'line': {
      vizComponent = (
        <Line
          visualizations={data}
          layoutConfig={{
            yaxis: {
              automargin: true,
            },
          }}
        />
      );
      break;
    }
    default: {
      vizComponent = <></>;
      break;
    }
  }
  return vizComponent;
};
