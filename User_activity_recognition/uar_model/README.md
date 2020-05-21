# Experiments with UCI HAR dataset

* Some experiments have also been carried out with the dataset UCI HAR - Dataset that has 6 classes: WALKING, WALKING_UPSTAIRS, WALKING_DOWNSTAIRS, SITTING, STANDING, LAYING. 

* Since we have only to recognize the movement, I merge the six classes in 2 classes: STANDING, MOVING. 

* For the experiment, I use a Random Forest classifier with a result accuracy of 97%. 

Unfortunately, I was unable to implement the system well, encountering several problems in extracting the features from the new input values. This experiment is in the git repository of this project. I used the Python library Scikit Learn.