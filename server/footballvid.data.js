import data from "./footballvid.schema.js";

export default {

	imageGet: (request, response) => {
		const filter = {};

		if (request.query.id) {
			filter["_id"] = request.query.id
		}
		if (request.query.filename) {
			filter["fileName"] = request.query.filename
		}

		data.image.find(filter)
			.lean()
			.exec()
			.then(imagesData => {
				const images = imagesData.map(({ _id, __v, ...image }) => ({ id: _id, ...image }));
				response.status(200).json({ images: images });
			})
			.catch(error => {
				response.status(560).json({ error: error.message });
			});
	},

	imageSave: (request, response) => {
		if (!request.body.imagedata) {
			response.status(550).json({ error: "Missing object to save" });
			return;
		}
		
		const imageSave = request.body.imagedata;

		if (imageSave.id) {
			data.image.findById(imageSave.id)
				.exec()
				.then(imageData => {
					if (!imageData) {
						throw new Error("Image not found");
					}

					Object.keys(imageSave).forEach(field => {
						if (field != "id") {
							imageData[field] = imageSave[field];
						}
					})

					return imageData.save();
				})
				.then(imageData => {
					response.status(200).json({ id: imageData._id });
				})
				.catch(error => {
					response.status(570).json({ error: error.message });
				});
		}
		else {
			new data.image({ ...imageSave })
				.save()
				.then(imageData => {
					response.status(200).json({ id: imageData._id });
				})
				.catch(error => {
					response.status(571).json({ error: error.message });
				})
		}
	},

	imageDelete: (request, response) => {
		if (!request.query.id) {
			response.status(550).json({ error: "Missing ID to delete" });
			return;
		}

		data.image.deleteOne({ _id: request.query.id })
			.then(() => {
				response.status(200).json({ status: "ok" });
			})
			.catch(error => {
				response.status(560).json({ error: error.message });
			});
	}

}