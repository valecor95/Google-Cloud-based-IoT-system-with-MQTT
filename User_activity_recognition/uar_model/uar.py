import pandas as pd
import numpy as np
import pickle

from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import *
from sklearn import svm
from sklearn.naive_bayes import *
from sklearn.ensemble import RandomForestClassifier
from sklearn.neighbors import KNeighborsClassifier
from sklearn import tree
from sklearn.metrics import classification_report, confusion_matrix
from sklearn.model_selection import train_test_split, cross_val_score, ShuffleSplit, GridSearchCV

################################### LOAD DATASET ################################
TRAIN = "train/"
TEST = "test/"
DATASET_PATH = "./UCI_HAR_Dataset/"
INPUT_SIGNAL_TYPES = [
    "body_acc_x_",
    "body_acc_y_",
    "body_acc_z_",
    "body_gyro_x_",
    "body_gyro_y_",
    "body_gyro_z_",
    "total_acc_x_",
    "total_acc_y_",
    "total_acc_z_"
]
LABELS = [
    "WALKING",
    "WALKING_UPSTAIRS",
    "WALKING_DOWNSTAIRS",
    "SITTING",
    "STANDING",
    "LAYING"
]

def load_X_train(X_signals_paths):
    X_signals = [None] * 7352

    for x in range(len(X_signals_paths)):
        f = open(X_signals_paths[x])
        lines = f.readlines()
        f.close()
        my_list = list(map(lambda x: x, lines))
        for i in range(len(my_list)):
            my_list[i] = my_list[i].split()
            if(x == 0):
                for j in range(128):
                    my_list[i][j] = float(my_list[i][j])
                X_signals[i] = my_list[i]
            else:
                for j in range(128):
                    X_signals[i].append(float(my_list[i][j]))
    return X_signals

def load_X_test(X_signals_paths):
    X_signals = [None] * 2947

    for x in range(len(X_signals_paths)):
        f = open(X_signals_paths[x])
        lines = f.readlines()
        f.close()
        my_list = list(map(lambda x: x, lines))
        for i in range(len(my_list)):
            my_list[i] = my_list[i].split()
            if(x == 0):
                for j in range(128):
                    my_list[i][j] = float(my_list[i][j])
                X_signals[i] = my_list[i]
            else:
                for j in range(128):
                    X_signals[i].append(float(my_list[i][j]))
    return X_signals

X_train_signals_paths = [ DATASET_PATH + TRAIN + "Inertial Signals/" + signal + "train.txt" for signal in INPUT_SIGNAL_TYPES ]
X_test_signals_paths = [ DATASET_PATH + TEST + "Inertial Signals/" + signal + "test.txt" for signal in INPUT_SIGNAL_TYPES ]

X = load_X_train(X_train_signals_paths)

X_train = np.asarray(X)
X_test = np.asarray(load_X_test(X_test_signals_paths))

def load_y_file(file):
    f = open(file)
    lines = f.readlines()
    f.close()
    my_list = list(map(lambda x: x, lines))
    for i in range(len(my_list)):
        my_list[i] = int(my_list[i])
        if(my_list[i] == 1 or my_list[i] == 2 or my_list[i] == 3):
            my_list[i] = 0
        else: my_list[i] = 1
    return my_list

y_train_path = DATASET_PATH + TRAIN + "y_train.txt"
y_test_path = DATASET_PATH + TEST + "y_test.txt"

y_train = np.asarray(load_y_file(y_train_path))
y_test = np.asarray(load_y_file(y_test_path))

#file1 = open("prova.txt", "w")
#file1.write(str(X[0]))
#file1.close()

print("Train: %d - Test: %d" %(X_train.shape[0],X_test.shape[0]))

################################### TRAIN MODEL ##################################

### CREATE MODEL
#model = BernoulliNB()
#model = MultinomialNB()
#model = svm.LinearSVC()
#model = KNeighborsClassifier()
#model = tree.DecisionTreeClassifier()
model = RandomForestClassifier()

### FIT MODEL
model.fit(X_train, y_train)

### EVALUATION
print("*** EVALUATION ***")
y_pred = model.predict(X_test)
print(confusion_matrix(y_test, y_pred))
print(classification_report(y_test, y_pred))

### SAVE THE MODEL
filename = 'my_har_model.pkl'
pickle.dump(model, open(filename, 'wb'))

'''
### PREDICTION
print("*** PREDICT ***")
xnew1 =[] 
xnew1.append(np.asarray(X[0]))
ynew1 = model.predict(np.asarray(xnew1))
print('RESULT = %d,   right = 1' %(ynew1))
'''