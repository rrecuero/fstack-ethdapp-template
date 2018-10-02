import moment from 'moment';

export function toUtcDate(date = null, offset = null, format = null) { // eslint-disable-line
  const utcDate = date ? new Date(date) : new Date();
  const utcMoment = moment.utc(utcDate);
  if (!offset) {
    return utcMoment.format(format || 'YYYY-MM-DD HH:mm').toString();
  }

  if (offset.second) {
    utcMoment.subtract(offset.second, 'seconds');
  }

  if (offset.minute) {
    utcMoment.subtract(offset.minute, 'minutes');
  }

  if (offset.hour) {
    utcMoment.subtract(offset.hour, 'hours');
  }

  if (offset.day) {
    utcMoment.subtract(offset.day, 'days');
  }

  if (offset.week) {
    utcMoment.subtract(offset.week, 'weeks');
  }

  if (offset.month) {
    utcMoment.subtract(offset.month, 'months');
  }

  if (offset.year) {
    utcMoment.subtract(offset.year, 'years');
  }

  return utcMoment.format(format || 'YYYY-MM-DD HH:mm').toString();
}
