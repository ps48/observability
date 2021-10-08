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

import { isEmpty } from 'lodash';
import datemath from '@elastic/datemath';
import { DATE_PICKER_FORMAT } from '../../common/constants/explorer';
import {
  PPL_INDEX_REGEX,
  PPL_INDEX_INSERT_POINT_REGEX,
  PPL_FIELDS_REGEX,
  PPL_CONTAINS_TIMESTAMP_REGEX,
} from '../../common/constants/shared';

export const getIndexPatternFromRawQuery = (query: string): string => {
  const matches = query.match(PPL_INDEX_REGEX);
  if (matches) {
    return matches[2];
  }
  return '';
};

export const insertFieldsToQuery = ({
  rawQuery,
  fields,
}: {
  rawQuery: string;
  fields: Array<any>;
}) => {
  let finalQuery = rawQuery;

  if (isEmpty(rawQuery)) return finalQuery;

  // insert fields
  if (!isEmpty(fields)) {
    const fieldsMatches = rawQuery.match(PPL_FIELDS_REGEX);
    let fieldPrefix = '| fields ';

    if (isEmpty(fieldsMatches)) {
      // rawQuery does not contain '| fields', inserts directly after index pattern
      const indexMatches = rawQuery.match(PPL_INDEX_INSERT_POINT_REGEX);
      finalQuery = `search ${indexMatches![1]}=${indexMatches![2]} ${
        fieldPrefix + fields.join(', ')
      }${indexMatches![3]}`;
    } else {
      // may just ignore for now
      // rawQuery does contain '| fields', extract existing fields str, add new fields
      // then inserts back to the same position
      // const finalFieldstr =  fieldPrefix += concatTokenList(fields, (field) => {
      //   return false;
      // });
      // finalQuery = `search ${fieldsMatches![1]} ${finalFieldstr + fieldsMatches![2]}`

      finalQuery = rawQuery;
    }
  }

  return finalQuery;
};

export const insertDateRangeToQuery = ({
  rawQuery,
  startTime,
  endTime,
  timeField = 'utc_time',
}: {
  rawQuery: string;
  startTime: string;
  endTime: string;
  timeField?: string;
}) => {
  let finalQuery = '';

  if (isEmpty(rawQuery)) return finalQuery;

  // convert to moment
  const start = datemath.parse(startTime)?.format(DATE_PICKER_FORMAT);
  const end = datemath.parse(endTime)?.format(DATE_PICKER_FORMAT);
  const dateRangeInsertingReg = /search (source|index)\s*=\s*([^\s]+)(.*)/i;
  const containsTimestamp = rawQuery.match(PPL_CONTAINS_TIMESTAMP_REGEX);

  if (isEmpty(containsTimestamp)) {
    const tokens = rawQuery.match(dateRangeInsertingReg);
    if (isEmpty(tokens)) return finalQuery;
    finalQuery = `search ${tokens![1]}=${
      tokens![2]
    } | where ${timeField} >= timestamp('${start}') and ${timeField} <= timestamp('${end}')${
      tokens![3]
    }`;
  } else {
    // will not touch timestamp when query already has a date range, in query date range will always override the date picker
    finalQuery = rawQuery;
  }

  return finalQuery;
};
