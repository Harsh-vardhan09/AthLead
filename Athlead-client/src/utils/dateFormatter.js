import dayjs from "dayjs";

export const formatDate = (date, format = "MMM D, YYYY") => {
  return dayjs(date).format(format);
};
