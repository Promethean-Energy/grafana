import React, { FC } from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { MuteTimingFields } from '../../types/mute-timing-form';
import { Field, InlineFieldRow, InlineField, Input, Button, IconButton, useStyles2 } from '@grafana/ui';
import { GrafanaTheme2 } from '@grafana/data';
import { css } from '@emotion/css';

interface Props {
  intervalIndex: number;
}

export const MuteTimingTimeRange: FC<Props> = ({ intervalIndex }) => {
  const styles = useStyles2(getStyles);
  const { register, formState } = useFormContext<MuteTimingFields>();

  const { fields: timeRanges, append: addTimeRange, remove: removeTimeRange } = useFieldArray<MuteTimingFields>({
    name: `time_intervals.${intervalIndex}.times`,
  });

  const timeRangeRegExp = /[0-2]{1}[0-9]{1}\:[0-5]{1}[0-9]{1}/;

  return (
    <div>
      <Field
        label="Time range"
        description="The time inclusive of the starting time and exclusive of the end time in UTC"
      >
        <>
          {timeRanges.map((timeRange, index) => {
            const formErrors = formState.errors.time_intervals?.[intervalIndex];
            return (
              <div className={styles.timeRange} key={timeRange.id}>
                <InlineFieldRow>
                  <InlineField label="Start time" invalid={!!formErrors?.times?.[index]?.start_time}>
                    <Input
                      {...register(`time_intervals.${intervalIndex}.times.${index}.start_time`, {
                        pattern: {
                          value: timeRangeRegExp,
                          message: 'Invalid start time',
                        },
                      })}
                      className={styles.timeRangeInput}
                      // @ts-ignore react-hook-form doesn't handle nested field arrays well
                      defaultValue={timeRange.start_time}
                      placeholder="HH:MM"
                      data-testid="mute-timing-starts-at"
                    />
                  </InlineField>
                  <InlineField label="End time" invalid={!!formErrors?.times?.[index]?.end_time}>
                    <Input
                      {...register(`time_intervals.${intervalIndex}.times.${index}.end_time`, {
                        pattern: {
                          value: timeRangeRegExp,
                          message: 'Invalid end time',
                        },
                      })}
                      className={styles.timeRangeInput}
                      // @ts-ignore react-hook-form doesn't handle nested field arrays well
                      defaultValue={timeRange.end_time}
                      placeholder="HH:MM"
                      data-testid="mute-timing-ends-at"
                    />
                  </InlineField>
                  <IconButton
                    className={styles.deleteTimeRange}
                    title={'Remove'}
                    name={'trash-alt'}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      removeTimeRange(index);
                    }}
                  />
                </InlineFieldRow>
              </div>
            );
          })}

          <Button
            variant="secondary"
            type="button"
            icon={'plus'}
            onClick={() => addTimeRange({ start_time: '', end_time: '' })}
          >
            Add another time range
          </Button>
        </>
      </Field>
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  timeRange: css`
    margin-bottom: ${theme.spacing(1)};
  `,
  timeRangeInput: css`
    width: 120px;
  `,
  deleteTimeRange: css`
    margin: ${theme.spacing(1)} 0 0 ${theme.spacing(0.5)};
  `,
});
