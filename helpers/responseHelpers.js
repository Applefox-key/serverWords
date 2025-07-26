export const sendResponse = (res, data, errorMessage = "Not found") => {
  if (!data) {
    console.log("sendResponse-", data, errorMessage);
    res.status(400).json({ error: errorMessage });
  } else {
    console.log("sendResponse+", data);
    res.status(200).json({ data });
  }
};

export const sendResult = (res, result, successMessage = "success") => {
  if (result.error) {
    console.log("sendResult-", result);
    res.status(400).json({ error: result.error });
  } else {
    console.log("sendResult+", result, successMessage);
    const response = { message: successMessage };
    if (result.id !== undefined) {
      response.id = result.id;
    }
    res.status(200).json(response);
  }
};
export const sendResultPayload = (res, result, payload) => {
  if (result.error) {
    res.status(400).json({ error: result.error });
    console.log("sendResultPayload-", result.error);
  } else {
    console.log("sendResultPayload+", result, payload);
    res.status(200).json(payload);
  }
};

export const sendOk = (res, message = "Ok") => {
  console.log("sendOk+", message);
  res.status(200).json({ message: message });
};

export const sendError = (
  res,
  errorMessage = "Something went wrong",
  code = 400
) => {
  console.log("sendError-", errorMessage);
  res.status(code).json({ error: errorMessage });
};
