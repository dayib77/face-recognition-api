const returnClarifaiOptions = image_url => {
  const PAT = "77a65b2646734567b8351d172d318173";
  const USER_ID = "clarifai";
  const APP_ID = "main";

  // const MODEL_ID = "face-detection";
  // const MODEL_VERSION_ID = "6dc7e46bc9124c5c8824be4822abe105";

  // const IMAGE_URL = "https://samples.clarifai.com/metro-north.jpg";

  const raw = JSON.stringify({
    user_app_id: {
      user_id: USER_ID,
      app_id: APP_ID,
    },
    inputs: [
      {
        data: {
          image: {
            url: image_url,
          },
        },
      },
    ],
  });

  return {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: "Key " + PAT,
    },
    body: raw,
  };
};

export default returnClarifaiOptions;
