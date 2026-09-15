import Capacitor
import HealthKit

@objc(NativeActivityHealthPlugin)
public class NativeActivityHealthPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "NativeActivityHealthPlugin"
    public let jsName = "NativeActivityHealth"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "status", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "authorize", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "readWeek", returnType: CAPPluginReturnPromise)
    ]
    private let store = HKHealthStore()
    @objc func status(_ call: CAPPluginCall) {
        call.resolve(["available": HKHealthStore.isHealthDataAvailable(), "provider": "healthkit"])
    }
    @objc func authorize(_ call: CAPPluginCall) {
        guard HKHealthStore.isHealthDataAvailable(), let steps = HKQuantityType.quantityType(forIdentifier: .stepCount) else {
            call.reject("HealthKit is unavailable", "HEALTH_UNAVAILABLE"); return
        }
        store.requestAuthorization(toShare: [], read: [steps]) { completed, error in
            if error != nil || !completed { call.reject("Health authorization could not complete", "HEALTH_DENIED"); return }
            // HealthKit intentionally does not disclose read permission status.
            call.resolve()
        }
    }
    @objc func readWeek(_ call: CAPPluginCall) {
        guard HKHealthStore.isHealthDataAvailable(), let steps = HKQuantityType.quantityType(forIdentifier: .stepCount) else {
            call.reject("HealthKit is unavailable", "HEALTH_UNAVAILABLE"); return
        }
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = TimeZone(identifier: "Asia/Tehran")!
        let now = Date()
        let today = calendar.startOfDay(for: now)
        guard let start = calendar.date(byAdding: .day, value: -6, to: today) else { call.reject("Invalid date", "HEALTH_READ_FAILED"); return }
        let query = HKStatisticsCollectionQuery(quantityType: steps,
            quantitySamplePredicate: HKQuery.predicateForSamples(withStart: start, end: now),
            options: .cumulativeSum, anchorDate: start, intervalComponents: DateComponents(day: 1))
        query.initialResultsHandler = { [weak self] query, result, error in
            defer { self?.store.stop(query) }
            guard error == nil, let result = result else { call.reject("Unable to read step totals", "HEALTH_READ_FAILED"); return }
            let formatter = DateFormatter()
            formatter.calendar = calendar
            formatter.locale = Locale(identifier: "en_US_POSIX")
            formatter.timeZone = calendar.timeZone
            formatter.dateFormat = "yyyy-MM-dd"
            var days: [[String: Any]] = []
            for offset in 0..<7 {
                guard let date = calendar.date(byAdding: .day, value: offset, to: start) else { continue }
                let quantity = result.statistics(for: date)?.sumQuantity()
                // Missing data also covers denied read access; never invent zero steps.
                days.append(["date": formatter.string(from: date), "steps": quantity.map { Int($0.doubleValue(for: HKUnit.count())) } as Any? ?? NSNull()])
            }
            call.resolve(["days": days])
        }
        store.execute(query)
    }
}

class Gym4MeBridgeViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(NativeActivityHealthPlugin())
    }
}
