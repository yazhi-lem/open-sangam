group "com.yazhi.sangam"

android {
    namespace "com.yazhi.sangam"
    compileSdk 35

    defaultConfig {
        applicationId "com.yazhi.sangam"
        minSdk 24
        targetSdk 35
        versionCode 1
        versionName "1.0.0"
    }

    buildTypes {
        release {
            signingConfig signingConfigs.debug
        }
    }
}

dependencies {
    implementation "androidx.core:core-ktx:1.15.0"
    implementation "androidx.lifecycle:lifecycle-runtime-ktx:2.8.7"
    implementation "androidx.activity:activity-compose:1.9.3"
}
